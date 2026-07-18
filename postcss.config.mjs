// Tailwind CSS v4 already runs Lightning CSS under the hood, which handles
// vendor prefixing. A separate autoprefixer pass is redundant, so we don't
// register it here anymore.
const config = {
  plugins: {
    "@tailwindcss/postcss": {},
  },
};

export default config;
