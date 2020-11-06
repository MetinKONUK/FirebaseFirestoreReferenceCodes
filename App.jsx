import React from 'react';
import './App.css';
import {connect} from "react-redux";
import {changeLastName} from "../Actions";
import firebase from "../Firebase";
import {Button, TextField} from "@material-ui/core";
import {uuid} from "uuidv4";
class App extends React.Component{
  state = {
    db : firebase.firestore(),
    users : [],
    username : "",
    lastname : "",
    disabled : false,
    toDeletedId : null
  };

  componentDidMount() {
    //Realtime firestore Listener
    this.state.db.collection("Users")
    .onSnapshot(snapshot => {
      snapshot.docChanges()
      .forEach(change => {
        if(change.type === "added") {
          // !!!!! IMPORTANT !!!!!
          /*Taking data everytime :
            Site loaded
            New data added
          //It is having doc by doc unlike real-time database of firebase
          */
          this.setState({
            users : this.state.users.concat(change.doc.data())
          });
        }    else if(change.type === "removed") {
          //Removing From State

          // !!!!! IMPORTANT !!!!!

          this.removeUserFromState(change.doc.data().id);
        }    else if(change.type === "modified") {
          //Updating State

          // !!!!! IMPORTANT !!!!!
          this.setState(prevState => {
            return prevState.users.reduce((acc, user) => {
               if(user.id !== `${change.doc.data().id}`) {
                acc.push(user);
              } else {
                user.Name = change.doc.data().Name
                acc.push(user);
              }
              return acc;
            }, []);
          });
        };
      });
    })
  };

  /*
   =>Sending user data to firestore
  =**> But we are getting random unique id via uuidv4 because it is so complicated 
  and not stable to have id from firebase itself by add().then(() => update()) 
  */
  sendName = () => {
    this.setState({disabled : true});
    const id = uuid();
    this.state.db.collection("Users").doc(`${id}`).set({
      Name : this.state.username,
      lastName : this.state.lastname,
      id
    }).then((snap) => {
      this.setState({disabled : false, username : "", lastname : ""});
    })

    .catch((err) => this.setState({disabled : false}));
  };

  //Handling simple input to state process  
  handleChange = e => {
    this.setState({
      [e.target.name] : e.target.value
    });
  };
  
  //Removing Deleted User from State
  /* 
    !!VERY IMPORTANT!!
    Removing from state by splice() method is not working since every user is an object
    and concat() doesn't work instead of push because cannot concat an object with an array
  */
  removeUserFromState = (userId) => {
    this.setState(prevState => {
      const n_state = prevState.users.reduce((acc, user) => {
        if(user.id !== `${userId}`) {
          acc.push(user);
        } 
       return acc; 
      }, []);
      return {
        users : n_state
      }
    } );
  }

  //Removing selected user from firebase/firestore 
  removeUser = userId => {
    this.state.db.collection("Users").doc(`${userId}`).delete().then(() => {
      //We would remove from state here via coding:
      //this.removeUserFromState(userId);

    })
    .catch(err => console.error(err));

  };

  updateUserName = (userId) => {
    this.state.db.collection("Users")
    .doc(userId).update({
      Name : this.state.new_username
    })
  }
  
  //Mapping users's array to JSX
  listUsers = users => (
    users.map(user => (
    <div key={user.id}>
      <span>{user.Name}</span>{" "}
      <span>{user.lastName}</span>{" "}
      <Button onClick={() => this.removeUser(user.id)}>X</Button>
      <TextField onChange={this.handleChange}  name="new_username" value={this.state.new_username}/>
      <Button onClick={() => this.updateUserName(user.id)}>UPDATE</Button>
      </div> 
    ) )
  );
  
  render() {
    //Constructing state arguments
    const {username, lastname, disabled, users} = this.state;
      return (
        <div className="App">
          {/* Rendering mapped array of users to JSX */}
          {this.listUsers(users)}
          {/* Input of the username and lastname of user */}
          <TextField onChange={this.handleChange}  name="username" value={username} disabled={disabled}/>
          <TextField onChange={this.handleChange}  name="lastname" value={lastname} disabled={disabled}/>
          {/* Button to send username and lastname values to firebase/firestore */}
          <Button onClick={() => this.sendName()} variant="contained" color="primary" disabled={disabled}>
          ADD
          </Button>
      </div>
    );
}
}

//Mapping State To Props
const mapStateToProps = (state) => ({
  lastName : state.first.lastName,
  name : state.first.name
});

export default connect(mapStateToProps, {changeLastName})(App);
