# Unit tests

The unit tests folder in this repository aim to provide comprehensive coverage for all major plugin functionality. Unit tests are written to test the behavior of individual classes and methods, with the goal covering all use cases of all functions.

Axioms for writing unit tests include:
- Tests should have no side effects.
- Test should use mocked data.
- Tests should have >90% code coverage. Ideally every parameter and method.
- All methods that render to a MapLibre map should additionally be tested in a browser using puppeteer.js.

In addition to these foundational tests with mocked data, each class should have at least one test using actual data.

## Running the test suite

✅ **`npm run test`** starts the test suite.

⚠️ You need to run `npm run build` first to generate a local copy of the plugin; this is required for the puppeteer.js tests!

**All unit tests must succeed in order for a pull request to be approved**. Additionally, any pull request that adds new features to the plugin must also include new unit tests covering those features.

## Test architecture

Tests are written using `vitest`, with the environment defined in [`vitest.config.js`](../vitest.config.js). All service responses are mocked using `vitest-fetch-mock`.

A custom test was written in order to access convenience objects and methods in every test. To add a new object to the test suite, modify [`BaseTest.ts](./BaseTest.ts) or extend the base test in another file.

The [`setupUnit.js`](./setupUnit.js) script runs on initial test setup. To execute code before all tests run, modify that file.
