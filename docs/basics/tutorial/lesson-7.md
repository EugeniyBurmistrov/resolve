## **Lesson 7** - Functionality Enhancements

[\[Get the Code for This Lesson\]](https://github.com/reimagined/resolve/tree/master/examples/shopping-list-tutorial/lesson-7)

The lesson describes how to perform the following enhancements to the Shopping List application's functionality:

- Modify the reSolve backend to provide the complete set of CRUD (create, read, update, delete) operations.
- Modify the frontend to support all CRUD operations.
- Add static resources to the frontend.

### Modify the Backend

#### Update the Write Side

Define the following events to support the full set of CRUD operations on the backend.

**common/event_types.js:**

```js
...
export const SHOPPING_LIST_CREATED = 'SHOPPING_LIST_CREATED'
export const SHOPPING_LIST_RENAMED = 'SHOPPING_LIST_RENAMED'
export const SHOPPING_LIST_REMOVED = 'SHOPPING_LIST_REMOVED'
export const SHOPPING_ITEM_REMOVED = 'SHOPPING_ITEM_REMOVED'
```

Modify the aggregate projection to enable the shopping list deletion.

**common/aggregates/shopping_list.projection.js:**

```js
[SHOPPING_LIST_REMOVED]: () => ({})
```

Define command handlers used to edit data.

**common/aggregates/shopping_list.commands.js:**

```js
...

  renameShoppingList: (state, { payload: { name } }) => {
    return {
      type: SHOPPING_LIST_RENAMED,
      payload: { name }
    }
  },

  removeShoppingList: state => {
    return {
      type: SHOPPING_LIST_REMOVED
    }
  },

  removeShoppingItem: (state, { payload: { id } }) => {
    return {
      type: SHOPPING_ITEM_REMOVED,
      payload: { id }
    }
  }
```

#### Update the Read Side

Modify the ShoppingList View Model projection to handle the new event types.

**common/view-models/shopping_list.projection.js:**

```js
...

  [SHOPPING_LIST_RENAMED]: (state, { payload: { name } }) => ({
    ...state,
    name
  }),

  [SHOPPING_LIST_REMOVED]: () => ({
    removed: true
  }),

  [SHOPPING_ITEM_REMOVED]: (state, { payload: { id } }) => ({
    ...state,
    list: state.list.filter(item => item.id !== id)
  })
```

Modify the ShoppingLists Read Model projection.

**common/read-models/shopping_lists.projection.js:**

```js
...

  [SHOPPING_LIST_REMOVED]: async (store, { aggregateId }) => {
    await store.delete('ShoppingLists', { id: aggregateId })
  },

  [SHOPPING_LIST_RENAMED]: async (
    store,
    { aggregateId, payload: { name } }
  ) => {
    await store.update('ShoppingLists', { id: aggregateId }, { $set: { name } })
  }
```

### Modify the Frontend

#### Use Static Content

Add the required static content to the application's **static** folder. The example application uses the following static files:

- The **Styles.css** file - Contains styles used by the application's client components.
- The **fontawesome.min.css** file an the **webfonts** folder - The standard [Font Awesome](https://fontawesome.com/) distribution.
- The **close-button.png** image - The Remove Shopping List button's icon.

#### Update Components

Modify the ShoppingLists component to provide a UI for shopping list deletion.

**client/components/ShoppingLists.js:**

```js
<th className="example-table-action">Action</th>
...

<td className="example-table-action">
  <Button
    onClick={() => {
      this.props.removeShoppingList(id)
    }}
  >
    <i className="far fa-trash-alt" />
  </Button>
</td>

```

```js
const { lists, createShoppingList, removeShoppingList } = this.props
...
<ShoppingLists lists={lists} removeShoppingList={removeShoppingList} />
```

Modify the ShoppingList component to provide the capability to rename shopping lists.

**client/containers/ShoppingList.js:**

```js
state = {
  shoppingListName: this.props.data && this.props.data.name
  ...
}

renameShoppingList = () => {
  this.props.renameShoppingList(this.props.aggregateId, {
    name: this.state.shoppingListName
  })
}

onShoppingListNamePressEnter = event => {
  if (event.charCode === 13) {
    event.preventDefault()
    this.renameShoppingList()
  }
}

updateShoppingListName = event => {
  this.setState({
    shoppingListName: event.target.value
  })
}
...

<FormControl
  type="text"
  value={this.state.shoppingListName}
  onChange={this.updateShoppingListName}
  onKeyPress={this.onShoppingListNamePressEnter}
  onBlur={this.renameShoppingList}
/>
```

Add the list item deletion functionality.

**client/containers/ShoppingList.js:**

```js
const {
  ...
  removeShoppingItem
} = this.props

<Image
  className="example-close-button"
  src="/close-button.png"
  onClick={removeShoppingItem.bind(null, aggregateId, {
    id: todo.id
  })}
/>
```

The code below demonstrates the **Image** component's implementation.

**client/containers/Image.js:**

```js
import { Image as BootstrapImage } from 'react-bootstrap'
import { connectStaticBasedUrls } from 'resolve-redux'

const Image = connectStaticBasedUrls(['src'])(BootstrapImage)

export default Image
```

#### Link Stylesheets:

Use the React Helmet component to link stylesheets to your application.

**client/containers/Header.js:**

```js
import {Helmet} from "react-helmet"
...

<Helmet>
  {css.map((href, index) => (
    <link rel="stylesheet" href={href} key={index} />
  ))}
  ...
</Helmet>
...
export default connectStaticBasedUrls(['css', 'favicon'])(Header)
```

**client/containers/App.js:**

```js
<Header
  css={['/fontawesome.min.css', '/style.css', ...]}
  ...
/>
```

#### Update the Optimistic Updates Code

Modify the code related to optimistic UI updates to support the shopping list deletion.

**client/actions/optimistic_actions.js:**

```js
...
export const OPTIMISTIC_REMOVE_SHOPPING_LIST = 'OPTIMISTIC_REMOVE_SHOPPING_LIST'
```

**client/reducers/optimistic_shopping_lists.js:**

```js
import { LOCATION_CHANGE } from 'react-router-redux'
...

  switch (action.type) {
    case LOCATION_CHANGE: {
      return []
    }
    case OPTIMISTIC_REMOVE_SHOPPING_LIST: {
      return state.filter(item => {
        return item.id !== action.payload.id
      })
    }
    ...
  }
```

**client/middlewares/optimistic_shopping_lists_middleware.js:**

```js
const optimistic_shopping_lists_middleware = store => next => action => {
  if (
    action.type === SEND_COMMAND_SUCCESS &&
    action.commandType === 'removeShoppingList'
  ) {
    store.dispatch({
      type: OPTIMISTIC_REMOVE_SHOPPING_LIST,
      payload: {
        id: action.aggregateId
      }
    })
  }

  next(action)
}
```
