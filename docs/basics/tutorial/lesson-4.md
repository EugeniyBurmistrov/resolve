## **Lesson 4** - Frontend - Display View Model Data in the Browser

[\[Get the Code for This Lesson\]](https://github.com/reimagined/resolve/tree/master/examples/shopping-list-tutorial/lesson-4)

This lesson provides information on how to display a View Model's data in the client browser. The lesson uses reSolve's **resolve-redux** library to implement a frontend based on React and Redux.

Note that, if required, you can use the [standard HTTP API](curl.md) to communicate with a reSolve backend and use any client technology to implement the frontend.

### Implement a React Frontend

The frontend's source files are located in the **client** folder by default. Create a **ShoppingList.js** file in the **client/containers** folder. In this file, implement a React component that displays a list of values obtained from the **[data](frontend.md#obtain-view-model-data)** prop:

**client/containers/ShoppingList.js:**

<!-- prettier-ignore-start -->

[embedmd]:# (../examples/shopping-list-tutorial/lesson-4/client/containers/ShoppingList.js /\/\// /^\}/)
```js
// The example code uses components from the react-bootstrap library to keep the markup compact.
import { ListGroup, ListGroupItem, Checkbox } from 'react-bootstrap'

export class ShoppingList extends React.PureComponent {
  render() {
    const list = this.props.data.list
    return (
      <ListGroup style={{ maxWidth: '500px', margin: 'auto' }}>
        {list.map(todo => (
          <ListGroupItem key={todo.id}>
            <Checkbox inline>{todo.text}</Checkbox>
          </ListGroupItem>
        ))}
      </ListGroup>
    )
  }
}
```

<!-- prettier-ignore-end -->

Use the **resolve-redux** library's **connectViewModel** HOC to bind your component to the **ShoppingList** View Model that you implemented in the previous lesson.

**client/containers/ShoppingList.js:**

<!-- prettier-ignore-start -->

[embedmd]:# (../examples/shopping-list-tutorial/lesson-4/client/containers/ShoppingList.js /export const mapStateToOptions/ /export default connectViewModel\(mapStateToOptions\)\(ShoppingList\)/)
```js
export const mapStateToOptions = (state, ownProps) => {
  return {
    viewModelName: 'ShoppingList',
    aggregateIds: ['shopping-list-1']
  }
}

export default connectViewModel(mapStateToOptions)(ShoppingList)
```

<!-- prettier-ignore-end -->

The connectViewModel HOC binds the original component to a reSolve View Model based on options that the **mapStateToOptions** function specifies. The **data** prop in your component's implementation is injected by this HOC. This prop provides access to the View Model's response object. You already saw this object when you manually performed a request using the HTTP API in the lesson 3:

```js
{
  "id": "shopping-list-1",
  "name": "List 1",
  "list": [
    {
      "id": "1",
      "text": "Milk",
      "checked": false
    },
    {
      "id": "2",
      "text": "Eggs",
      "checked": false
    },
    {
      "id": "3",
      "text": "Canned beans",
      "checked": false
    },
    {
      "id": "4",
      "text": "Paper towels",
      "checked": false
    }
  ]
}
```

Insert the implemented **ShoppingList** component into the application's root component:

**client/containers/App.js:**

```js
const App = () => (
  <div>
    ...
    <ShoppingList />
  </div>
)
```

Run your application to see the result:

![result](assets/tutorial/lesson4_result.png)
