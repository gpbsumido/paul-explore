// Encodes a frame list into an H.264 MP4 with AVFoundation, so the intro
// video needs nothing installed beyond what ships with macOS and Xcode.
//
//   swift scripts/encode-frames.swift <frames.txt> <out.mp4> <fps> <bits per second>
//
// Each line of the list is a PNG path, a tab, and how many frames to hold it
// for. A held screenshot is one image appended that many times, which H.264
// stores as next to nothing, so a still scene costs almost no bytes.
//
// macOS 27 deprecates these AVAssetWriter calls in favour of its input
// receivers, which older macOS doesn't have. They still work, with warnings.

import AVFoundation
import CoreGraphics
import Foundation
import ImageIO

let args = CommandLine.arguments
guard args.count == 5, let fps = Int32(args[3]), let bitrate = Int(args[4]) else {
    FileHandle.standardError.write("usage: swift encode-frames.swift <frames.txt> <out.mp4> <fps> <bits per second>\n".data(using: .utf8)!)
    exit(2)
}

let entries: [(path: String, count: Int)] = try String(contentsOfFile: args[1], encoding: .utf8)
    .split(separator: "\n")
    .map { line in
        let parts = line.split(separator: "\t")
        return (String(parts[0]), Int(parts[1]) ?? 1)
    }

func image(_ path: String) -> CGImage {
    guard let source = CGImageSourceCreateWithURL(URL(fileURLWithPath: path) as CFURL, nil),
          let image = CGImageSourceCreateImageAtIndex(source, 0, nil) else {
        fatalError("can't read \(path)")
    }
    return image
}

let first = image(entries[0].path)
let width = first.width
let height = first.height
let output = URL(fileURLWithPath: args[2])
try? FileManager.default.removeItem(at: output)

let writer = try AVAssetWriter(outputURL: output, fileType: .mp4)
// The index goes at the front, so a browser can start playing before it has the whole file.
writer.shouldOptimizeForNetworkUse = true
let input = AVAssetWriterInput(mediaType: .video, outputSettings: [
    AVVideoCodecKey: AVVideoCodecType.h264,
    AVVideoWidthKey: width,
    AVVideoHeightKey: height,
    AVVideoCompressionPropertiesKey: [
        AVVideoAverageBitRateKey: bitrate,
        AVVideoProfileLevelKey: AVVideoProfileLevelH264HighAutoLevel,
        AVVideoMaxKeyFrameIntervalKey: Int(fps) * 2,
    ],
])
let adaptor = AVAssetWriterInputPixelBufferAdaptor(assetWriterInput: input, sourcePixelBufferAttributes: [
    kCVPixelBufferPixelFormatTypeKey as String: kCVPixelFormatType_32ARGB,
    kCVPixelBufferWidthKey as String: width,
    kCVPixelBufferHeightKey as String: height,
])
writer.add(input)
guard writer.startWriting() else { fatalError("can't start: \(String(describing: writer.error))") }
writer.startSession(atSourceTime: .zero)

func buffer(for picture: CGImage) -> CVPixelBuffer {
    var made: CVPixelBuffer?
    guard let pool = adaptor.pixelBufferPool, CVPixelBufferPoolCreatePixelBuffer(nil, pool, &made) == kCVReturnSuccess, let pixels = made else {
        fatalError("no pixel buffer")
    }
    CVPixelBufferLockBaseAddress(pixels, [])
    defer { CVPixelBufferUnlockBaseAddress(pixels, []) }
    guard let context = CGContext(
        data: CVPixelBufferGetBaseAddress(pixels),
        width: width,
        height: height,
        bitsPerComponent: 8,
        bytesPerRow: CVPixelBufferGetBytesPerRow(pixels),
        space: CGColorSpace(name: CGColorSpace.sRGB)!,
        bitmapInfo: CGImageAlphaInfo.premultipliedFirst.rawValue
    ) else { fatalError("no drawing context") }
    context.draw(picture, in: CGRect(x: 0, y: 0, width: width, height: height))
    return pixels
}

var frame: Int64 = 0
for entry in entries {
    let pixels = buffer(for: image(entry.path))
    for _ in 0..<entry.count {
        while !input.isReadyForMoreMediaData { usleep(2_000) }
        guard adaptor.append(pixels, withPresentationTime: CMTime(value: frame, timescale: fps)) else {
            fatalError("append failed at frame \(frame): \(String(describing: writer.error))")
        }
        frame += 1
    }
}
input.markAsFinished()
let done = DispatchSemaphore(value: 0)
writer.finishWriting { done.signal() }
done.wait()
guard writer.status == .completed else { fatalError("didn't finish: \(String(describing: writer.error))") }
// Optimizing for the network rewrites the file through a sibling it leaves behind. Tidy it away.
let folder = output.deletingLastPathComponent()
for leftover in (try? FileManager.default.contentsOfDirectory(atPath: folder.path)) ?? [] where leftover.hasPrefix(output.lastPathComponent + ".sb-") {
    try? FileManager.default.removeItem(at: folder.appendingPathComponent(leftover))
}
print("wrote \(frame) frames, \(String(format: "%.1f", Double(frame) / Double(fps))) s, to \(output.path)")
