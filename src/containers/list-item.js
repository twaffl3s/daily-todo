import { connect } from 'react-redux'
import ListItemPresenter from "../components/list-item-presenter.js"
import { send } from 'redux-electron-ipc'
import {delItem, toggleComplete, toggleDetailsVisibility, toggleEdit, updateDescription} from '../actions'

const mapStateToProps = (state, ownProps) => {
  return {
    isExpanded: ownProps.expanded,
    isComplete: ownProps.complete,
    isEditing: ownProps.isEditing,
    title: ownProps.title,
    details: ownProps.details,
    id: ownProps.id
  }
}

const mapDispatchToProps = (dispatch, ownProps) => {
  return {
    delItem: () => {
      dispatch(delItem(ownProps))
    },
    toggleDetailsVisibility: () => {
      dispatch(toggleDetailsVisibility(ownProps.id))
    },
    toggleComplete: (id) => {
      dispatch(send('completed-action', id))
    },
    toggleEdit: () => {
      dispatch(toggleEdit(ownProps.id))
    },
    updateDescription: (new_description) => {
      dispatch(updateDescription(ownProps.id, new_description))
    },
    saveUpdate: ()=> {
      dispatch(send('updated-description', {id: ownProps.id, description: ownProps.description}))
    }
  }
}

const ListItem = connect(
  mapStateToProps,
  mapDispatchToProps
)(ListItemPresenter)

export default ListItem