import {
  defaultResolveConfig,
  build,
  start,
  watch,
  runTestcafe,
  merge
} from 'resolve-scripts'
import fs from 'fs'

import appConfig from './config.app'
import devConfig from './config.dev'
import prodConfig from './config.prod'
import testFunctionalConfig from './config.test_functional'

const launchMode = process.argv[2]

void (async () => {
  switch (launchMode) {
    case 'dev': {
      await watch(merge(defaultResolveConfig, appConfig, devConfig))
      break
    }

    case 'build': {
      await build(merge(defaultResolveConfig, appConfig, prodConfig))
      break
    }

    case 'start': {
      await start(merge(defaultResolveConfig, appConfig, prodConfig))
      break
    }

    case 'test:functional': {
      if (fs.existsSync('read-models-test-functional.db')) {
        fs.unlinkSync('read-models-test-functional.db')
      }
      if (fs.existsSync('event-store-test-functional.db')) {
        fs.unlinkSync('event-store-test-functional.db')
      }
      if (fs.existsSync('local-bus-broker.db')) {
        fs.unlinkSync('local-bus-broker.db')
      }
      await runTestcafe({
        resolveConfig: merge(
          defaultResolveConfig,
          appConfig,
          testFunctionalConfig
        ),
        functionalTestsDir: 'test/functional',
        browser: process.argv[3]
      })
      break
    }

    default: {
      throw new Error('Unknown option')
    }
  }
})().catch(error => {
  // eslint-disable-next-line no-console
  console.log(error)
  process.exit(1)
})