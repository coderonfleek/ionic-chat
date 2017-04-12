/**
 * Created by imac on 12/29/15.
 */
var express = require('express');
var mongoose = require('mongoose');
var app = express();
var server = require('http').Server(app);
var io = require('socket.io')(server);



//Connect to the MongoDB Server
mongoose.connect('mongodb://localhost/diliva');


/*Create Schemas*/

//User Schema
var UserSchema = mongoose.Schema({
    user_id : mongoose.Schema.ObjectId,
    username : { type: String, required: true, unique: true },
    date_joined : Date
});

//Chat Room Schema
var ChatroomSchema = mongoose.Schema({
    chat_group_id : mongoose.Schema.ObjectId,
    user_id : String,
    group_name : String,
    date_created : Date,
    modified_by : String,
    date_modified : Date,
    members : Array
});

//Chat Schema
var ChatSchema = mongoose.Schema({
    message_id : mongoose.Schema.ObjectId,
    chat_group_id : String,
    user_id : String,
    message : String,
    time_stamp : Number,
    media_file_url : String,
    media_file_type : String,
    date_delivered : Date,
    sent_status : Boolean,
    duplicate_msg_id : String
});

/* Create Models from the Schemas */
var User = mongoose.model('User', UserSchema);

var ChatRoom = mongoose.model('ChatRoom', ChatroomSchema);

var Chat = mongoose.model('Chat', ChatSchema);

// allow CORS
app.all('*', function(req, res, next) {
    //res.header("Access-Control-Allow-Credentials", false);
    res.header("Access-Control-Allow-Origin", "*");
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-type,Accept,X-Access-Token,X-Key');
    if (req.method == 'OPTIONS') {
        res.status(200).end();
    } else {
        next();
    }
});


/********** Setup the Socket Connection ****************/

io.on('connection', function(socket){

    //Get all Users
    User.find({}, function(err, users) {
        if (err) throw err;

        //Emit Connection Message showing the user that he is presently connected
        socket.emit('client_connected', {message : "Online", users : users});

    });


    //Create User
    socket.on('create_user', function(data){

        //Create a New user with the User Model
        var newUser = User({username : data.username});
        var messageBody;

        newUser.save(function(err){
            if(err){

                messageBody =  {success : false, message : "User could not be created "+err};
                //throw err;
            }
            else{
                messageBody =  {success : true, message : "User Successfully Created"};
            }

            socket.emit('user_created', messageBody);
        });
    });


    //Create Room
    socket.on('create_room', function(data){

        var newRoom = ChatRoom(data);
        var messageBody;

        newRoom.save(function(err, room){
            if(err){

                messageBody =  {success : false, message : "Room could not be created "+err};
                //throw err;
            }
            else{
                messageBody =  {success : true, message : "Room "+room.group_name+" Successfully Created", room : room};
            }

            socket.emit('room_created', messageBody);
        });
    });
   
    //Get all Rooms
    socket.on('get_rooms', function(data){

        //Get Rooms where the user is a member

       /* ChatRoom.find({user_id : data.username}, function(err, rooms){*/
        ChatRoom.find({ members: { $in: [data.username] } }, function(err, rooms){

            socket.emit('my_rooms', {rooms : rooms});

        });

    });

    //Room Switch (Join the User to the present room)
    socket.on('switched_room', function(data){
        socket.join(data.new_room);
    });
    
    //Get All Members in a Particluar Room
    socket.on('get_members', function(data) {

        ChatRoom.findById(data.room_id, function(err, room) {
            if(err) throw err;
            
            socket.emit('room_members', {members : room.members});
        });
    });

    //Get Non Members of a Room
    
    socket.on('get_non_members', function(data){

        //Find this room and get the current members

        ChatRoom.findById(data.room_id, function(err, room) {
            
            if(err) throw err;
            //Get all members
            var members_array = room.members;

            //Fetch all members not in the room
            User.find({ username: { $nin: members_array } }, function(err, non_members){
                
                if(err) throw err;

                //Send back the non_members
                socket.emit('non_members', {non_members : non_members});
            });
        });

    });

    //Add a new member to a room
    socket.on('add_member', function(data){

        //Find the Room
        ChatRoom.findById(data.room._id, function(err, room){

            if(err) throw err;

            //console.log(room.members);

            //Add the user
            room.members.push(data.member.username);

            //Save the update
            room.save(function(err){
                if(err) throw err;

                //NB: The User automatically joins his Rooms when they load


                //Send the Confirmation
                socket.emit('member_added', {
                    message : data.member.username+" Successfully Added",
                    room :room
                });

            });//End Save

        });//End find

    });

    //Fetch all Messages For a Room
    socket.on('fetch_messages', function (data) {

        Chat.find({chat_group_id : data.room_id}, function(err, messages){
            
            if(err) throw err;

            socket.emit('room_messages', {messages : messages, room_id: data.room_id});
        });
    });
    
    //Fetch New Messages in a Room
    socket.on('fetch_new_messages', function (data) {

        Chat.find({chat_group_id : data.room_id}, function(err, messages){
            
            if(err) throw err;

            socket.emit('new_room_messages', {messages : messages, room_id: data.room_id});
        });
    });

    
    socket.on('message', function(data){

        //Filter out duplicate messages resulting from duplicate events
        Chat.find({duplicate_msg_id : data.duplicate_msg_id}, function(err, message){
            
            if(err) throw err;
            
            //console.log(message);

                    //If this message cannot be found
                    if(message.length === 0){
                        var newMessage = Chat(data);
                        //Save the Message
                        newMessage.save(function(err, message){
                            if(err) throw err;
                           //Broadcast the message
                           //console.log(message);
                            socket.broadcast.in(message.chat_group_id).emit('new_message', {message : message});
                            //socket.broadcast.in(data.chat_group_id).emit('new_message', {message : message});
                        });
                    }

                });

        
    });
    

});//End Socket Connection


/**** Bootup the Server ****/

var port = process.env.PORT || 1227;
server.listen(port, function(err){
    if(err) throw err;
    console.log("Server now running at port: "+port);
});







