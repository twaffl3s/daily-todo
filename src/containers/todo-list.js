import { connect } from 'react-redux'
import ToDoListPresenter from '../components/todo-list-presenter.js'

const mapStateToProps = (state, ownProps) => {
  return {
    todoItems: state.todoItems
  }
}

const ToDoList = connect(
  mapStateToProps
)(ToDoListPresenter)

export default ToDoList