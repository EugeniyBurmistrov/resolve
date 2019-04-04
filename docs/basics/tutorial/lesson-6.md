## **Lesson 6** - Frontend - Support Multiple Shopping Lists

[\[Get the Code for This Lesson\]](https://github.com/reimagined/resolve/tree/master/examples/shopping-list-tutorial/lesson-6)

Currently, your Shopping List application's UI only allows users to view and edit one shopping list (**shopping-list-1**). This lesson describes how to create multiple shopping lists and navigate between these lists from the client UI.

### Implement a Shopping Lists Read Model

First, modify the application's backend so it can provide information about all available shopping lists. You can implement a View Model to achieve this goal, but this approach is inefficient.

Consider a situation when your application runs in a production environment for a long time and end-users have created a large number of shopping lists. In such situation, a View Model's projection would apply every event from the store to the response object. This would result in a considerable performance overhead _on every request_.

Use a **[Read Model](read-side.md#read-models)** to overcome this limitation. The code sample below demonstrates the ShoppingLists Read Model's projection.

**common/read-models/shopping_lists.projection.js:**

<!-- prettier-ignore-start -->

[embedmd]:# (../examples/shopping-list-tutorial/lesson-6/common/read-models/shopping_lists.projection.js /^/   /\n$/)
```js
import { SHOPPING_LIST_CREATED } from '../eventTypes'

export default {
  Init: async store => {
    await store.defineTable('ShoppingLists', {
      indexes: {
        id: 'string'
      },
      fields: ['createdAt', 'name']
    })
  },

  [SHOPPING_LIST_CREATED]: async (
    store,
    { aggregateId, timestamp, payload: { name } }
  ) => {
    const shoppingList = {
      id: aggregateId,
      name,
      createdAt: timestamp
    }

    await store.insert('ShoppingLists', shoppingList)
  }
}
```

<!-- prettier-ignore-end -->

A Read Model's projection functions apply event data to a persistent store. You also need to implement a **[query resolver](read-side.md#resolvers)** to answer data queries based on the data from the store.

**common/read-models/shopping_lists.resolvers.js:**

<!-- prettier-ignore-start -->

[embedmd]:# (../examples/shopping-list-tutorial/lesson-6/common/read-models/shopping_lists.resolvers.js /^/   /\n$/)
```js
export default {
  all: async store => {
    return await store.find('ShoppingLists', {}, null, { createdAt: 1 })
  }
}
```

<!-- prettier-ignore-end -->

In this example, the **all** resolver returns all available shopping lists.

Next, register the created Read Model in the application's configuration file.

**config.app.js:**

<!-- prettier-ignore-start -->

[embedmd]:# (../examples/shopping-list-tutorial/lesson-6/config.app.js /^[[:blank:]]+readModels:/ /\],/)
```js
  readModels: [
    {
      name: 'ShoppingLists',
      projection: 'common/read-models/shopping_lists.projection.js',
      resolvers: 'common/read-models/shopping_lists.resolvers.js'
    }
  ],
```

<!-- prettier-ignore-end -->

### Query a Read Model Through HTTP API

You can use the standard HTTP API to test the ShoppingLists Read Model's functionality:

```sh
$ curl -X POST \
-H "Content-Type: application/json" \
-d "{}" \
"http://localhost:3000/api/query/ShoppingLists/all"


% Total    % Received % Xferd  Average Speed   Time    Time     Time  Current
                                 Dload  Upload   Total   Spent    Left  Speed
100   186  100   184  100     2    844      9 --:--:-- --:--:-- --:--:--   906[
  {
    "id": "shopping-list-1",
    "name": "List 1",
    "createdAt": 1543325125945
  },
  {
    "id": "shopping-list-2",
    "name": "List 2",
    "createdAt": 1543325129138
  }
]
```

### Implement Client UI

You can now implement the UI to display all available shopping lists and create new shopping lists.

**client/containers/MyLists.js:**

<!-- prettier-ignore-start -->

[embedmd]:# (../examples/shopping-list-tutorial/lesson-6/client/containers/MyLists.js /class MyLists/ /^}/)
```js
class MyLists extends React.PureComponent {
  render() {
    const { lists, createShoppingList } = this.props
    return (
      <div style={{ maxWidth: '500px', margin: 'auto' }}>
        <ShoppingLists lists={lists} />
        <ShoppingListCreator
          lists={lists}
          createShoppingList={createShoppingList}
        />
      </div>
    )
  }
}
```

<!-- prettier-ignore-end -->

> Refer to example project's [ShoppingLists.js](https://github.com/reimagined/resolve/blob/master/examples/shopping-list-tutorial/lesson-6/client/components/ShoppingLists.js) and [ShoppingListsCreator.js](https://github.com/reimagined/resolve/blob/master/examples/shopping-list-tutorial/lesson-6/client/components/ShoppingListCreator.j) files to see how you can implement these components.

Connect the MyLists container component to the ShoppingLists Read Model as shown below.

**client/containers/MyLists.js:**

```js
export const mapStateToOptions = () => ({
  readModelName: 'ShoppingLists',
  resolverName: 'all',
  resolverArgs: {}
})

export const mapStateToProps = (state, ownProps) => ({
  lists: ownProps.data
})

export const mapDispatchToProps = (dispatch, { aggregateActions }) =>
  bindActionCreators(aggregateActions, dispatch)

export default connectReadModel(mapStateToOptions)(
  connect(
    mapStateToProps,
    mapDispatchToProps
  )(MyLists)
)
```

Configure the React router to enable navigation between the application pages.

**client/routes.js:**

<!-- prettier-ignore-start -->

[embedmd]:# (../examples/shopping-list-tutorial/lesson-6/client/routes.js /^/ /\n$/)
```js
import App from './containers/App'
import ShoppingList from './containers/ShoppingList'
import MyLists from './containers/MyLists'

export default [
  {
    component: App,
    routes: [
      {
        path: '/',
        component: MyLists,
        exact: true
      },
      {
        path: '/:id',
        component: ShoppingList
      }
    ]
  }
]
```

<!-- prettier-ignore-end -->

Next, modify the **App** component to use the router.

**client/containers/App.js:**

<!-- prettier-ignore-start -->

[embedmd]:# (../examples/shopping-list-tutorial/lesson-6/client/containers/App.js /^/ /\n$/)
```js
import React from 'react'

import Header from './Header.js'
import ShoppingList from './ShoppingList'

const App = ({
  children,
  match: {
    params: { id }
  }
}) => (
  <div>
    <Header
      title="reSolve Shopping List"
      name="Shopping List"
      favicon="/favicon.ico"
      css={['/bootstrap.min.css']}
    />
    {children}
  </div>
)

export default App
```

<!-- prettier-ignore-end -->

Additionally, modify the **ShoppingList** component so it obtains the selected shopping list's aggregate ID from the **:id** route parameter.

**client/containers/ShoppingList.js:**

```jsx
export const mapStateToOptions = (state, ownProps) => {
  const aggregateId = ownProps.match.params.id

  return {
    viewModelName: 'ShoppingList',
    aggregateIds: [aggregateId]
  }
}

export const mapStateToProps = (state, ownProps) => {
  const aggregateId = ownProps.match.params.id

  return {
    aggregateId
  }
}
```

Run the application and try to create a new shopping list. You will notice that the frontend correctly sends commands to the server, but the created shopping list only appears after you refresh the page. This is an expected behavior because, in contrast to View Models, Read Models are not reactive. This means that components connected to Read Models do not automatically synchronize their Redux state with the Read Model's state on the server.

To overcome this limitation, implement optimistic UI updates as the next section describes.

### Support Optimistic UI Updates

With this approach, a component applies model changes to the Redux state before it sends these changes to the server. Follow the steps below to provide such functionality.

First, define Redux actions that perform state updates.

**client/actions/optimistic_actions.js:**

<!-- prettier-ignore-start -->

[embedmd]:# (../examples/shopping-list-tutorial/lesson-6/client/actions/optimistic_actions.js /^/ /\n$/)
```js
export const OPTIMISTIC_CREATE_SHOPPING_LIST = 'OPTIMISTIC_CREATE_SHOPPING_LIST'
export const OPTIMISTIC_SYNC = 'OPTIMISTIC_SYNC'
```

<!-- prettier-ignore-end -->

Implement an optimistic reducer function that handles these actions to update the corresponding slice of the Redux state.

**client/reducers/optimistic_shopping_lists.js:**

<!-- prettier-ignore-start -->

[embedmd]:# (../examples/shopping-list-tutorial/lesson-6/client/reducers/optimistic_shopping_lists.js /^/ /\n$/)
```js
import { LOCATION_CHANGE } from 'react-router-redux'
import {
  OPTIMISTIC_CREATE_SHOPPING_LIST,
  OPTIMISTIC_SYNC
} from '../actions/optimistic_actions'

const optimistic_shopping_lists = (state = [], action) => {
  switch (action.type) {
    case LOCATION_CHANGE: {
      return []
    }
    case OPTIMISTIC_CREATE_SHOPPING_LIST: {
      return [
        ...state,
        {
          id: action.payload.id,
          name: action.payload.name
        }
      ]
    }
    case OPTIMISTIC_SYNC: {
      return action.payload.originalLists
    }
    default: {
      return state
    }
  }
}

export default optimistic_shopping_lists
```

<!-- prettier-ignore-end -->

Provide a middleware that intercepts the service actions used for communication between Redux and reSolve.

**client/reducers/optimistic_shopping_lists_middleware.js:**

<!-- prettier-ignore-start -->

[embedmd]:# (../examples/shopping-list-tutorial/lesson-6/client/middlewares/optimistic_shopping_lists_middleware.js /^/ /\n$/)
```js
import { actionTypes } from 'resolve-redux'

import {
  OPTIMISTIC_CREATE_SHOPPING_LIST,
  OPTIMISTIC_SYNC
} from '../actions/optimistic_actions'

const { SEND_COMMAND_SUCCESS, LOAD_READMODEL_STATE_SUCCESS } = actionTypes

const optimistic_shopping_lists_middleware = store => next => action => {
  if (
    action.type === SEND_COMMAND_SUCCESS &&
    action.commandType === 'createShoppingList'
  ) {
    store.dispatch({
      type: OPTIMISTIC_CREATE_SHOPPING_LIST,
      payload: {
        id: action.aggregateId,
        name: action.payload.name
      }
    })
  }
  if (action.type === LOAD_READMODEL_STATE_SUCCESS) {
    store.dispatch({
      type: OPTIMISTIC_SYNC,
      payload: {
        originalLists: action.result
      }
    })
  }

  next(action)
}

export default optimistic_shopping_lists_middleware
```

<!-- prettier-ignore-end -->

Modify the MyLists component's **mapStateToProps** function to obtain the component's props from the corresponding slice of the Redux state:

```jsx
export const mapStateToProps = (state, ownProps) => ({
  lists: state.optimisticShoppingLists || []
})
```

Run your application and create a new shopping list to view the result.

---
