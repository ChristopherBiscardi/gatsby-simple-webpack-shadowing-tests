const webpack = require("webpack");
const path = require("path");
const ShadowRealm = require("gatsby/dist/internal-plugins/webpack-theme-component-shadowing");

test.each([
  [
    "inits but does not use shadowing",
    {
      mode: "development",
      entry: "./index.js",
      resolve: { plugins: [new ShadowRealm({ themes: [] })] }
    },
    { context: path.resolve(__dirname, "test-sites/non-usage") },
    "./index.js"
  ],
  [
    "shadows a single .js file",
    {
      mode: "development",
      entry: "./index.js",
      resolve: {
        plugins: [
          new ShadowRealm({
            themes: [
              {
                themeName: "theme-a",
                themeDir: path.join(
                  __dirname,
                  "./test-sites/basic-shadowing/node_modules/theme-a"
                )
              }
            ]
          })
        ]
      }
    },
    { context: path.resolve(__dirname, "test-sites/basic-shadowing") },
    "./src/theme-a/components.js"
  ],
  [
    "shadows a single .css file",
    {
      mode: "development",
      entry: "./index.js",
      resolve: {
        plugins: [
          new ShadowRealm({
            themes: [
              {
                themeName: "theme-a",
                themeDir: path.join(
                  __dirname,
                  "./test-sites/css-shadowing/node_modules/theme-a"
                )
              }
            ]
          })
        ]
      },
      module: {
        rules: [{ test: /\.css$/, use: "gatsby-raw-test-loader" }]
      },
      resolveLoader: {
        modules: ["../../fake-loaders"]
      }
    },
    { context: path.resolve(__dirname, "test-sites/css-shadowing") },
    "./src/theme-a/styles.css"
  ],
  [
    "shadows .tsx with .js and .tsx",
    {
      mode: "development",
      entry: "./index.js",
      resolve: {
        extensions: [".ts", ".tsx", ".js"],
        plugins: [
          new ShadowRealm({
            themes: [
              {
                themeName: "theme-a",
                themeDir: path.join(
                  __dirname,
                  "./test-sites/ts-shadowing/node_modules/theme-a"
                )
              }
            ]
          })
        ]
      },
      module: {
        rules: [{ test: /\.tsx?$/, use: "gatsby-raw-test-loader" }]
      },
      resolveLoader: {
        modules: ["../../fake-loaders"]
      }
    },
    { context: path.resolve(__dirname, "test-sites/ts-shadowing") },
    [
      "./src/theme-a/file-a.tsx",
      "./src/theme-a/file-b.js",
      "./src/theme-a/file-c.ts"
    ]
  ],
  [
    "edge case; extra extensions in filename",
    {
      mode: "development",
      entry: "./index.js",
      resolve: {
        extensions: [".js", ".tsx"],
        alias: {
          "@components": path.join(
            __dirname,
            "./test-sites/dot-shadowing/node_modules/theme-a/src"
          )
        },
        plugins: [
          new ShadowRealm({
            themes: [
              {
                themeName: "theme-a",
                themeDir: path.join(
                  __dirname,
                  "./test-sites/dot-shadowing/node_modules/theme-a"
                )
              }
            ]
          })
        ]
      }
    },
    { context: path.resolve(__dirname, "test-sites/dot-shadowing") },
    "./src/theme-a/Some.Component.js"
  ]
])("Shadowing e2e: %s", (testName, config, { context }, shadowPath, done) => {
  // shadowing wants process.cwd() to be the root of the site.
  // so change it from this dir to each of the example projects
  // when running them
  const oldCwd = process.cwd();
  const newCwd = context;
  process.chdir(newCwd);

  webpack(config, (err, stats) => {
    // start error handling
    if (err) {
      done(err.stack || err);
      return;
    }

    const info = stats.toJson();

    if (stats.hasErrors()) {
      done(info.errors);
    }

    if (stats.hasWarnings()) {
      done(info.warnings);
    }
    // end error handling

    const statsJSON = stats.toJson({
      assets: false,
      hash: true
    });
    const moduleNames = statsJSON.modules.map(({ name }) => name);
    console.log(moduleNames);
    if (Array.isArray(shadowPath)) {
      shadowPath.forEach(aShadowPath => {
        expect(moduleNames.includes(aShadowPath)).toBe(true);
      });
    } else {
      expect(moduleNames.includes(shadowPath)).toBe(true);
    }
    process.chdir(oldCwd);
    done();
  });
});
