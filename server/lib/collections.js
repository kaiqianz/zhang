Messages = new Meteor.Collection('messages');
Channels = new Meteor.Collection('channels');
ChatRooms = new Meteor.Collection("chatrooms");
Notifications = new Meteor.Collection('notifications');

Pairs = new Mongo.Collection("pairs");
Words = new Mongo.Collection("words");
Requests = new Mongo.Collection("requests");
Candidates = new Mongo.Collection("candidates");
Songs = new Mongo.Collection("songs");

Meteor.publish("userStatus", function() {
  return Meteor.users.find();
});

Meteor.publish("chatrooms",function(){
    return ChatRooms.find({});
});

Meteor.publish("words", function() {
        return Words.find();                         
});

Meteor.publish("candidates", function(){
    return Candidates.find();
});

Meteor.publish("songs", function(){
    return Songs.find();
});

Meteor.publish('notifications', function() {
  return Notifications.find();
});

Meteor.startup(function(){
   ChatRooms.allow({
        'insert':function(userId,doc){
            return true;
        },
        'update':function(userId,doc,fieldNames, modifier){
            return true;
        },
        'remove':function(userId,doc){
            return false;
        }
    });

    Meteor.startup(function(){
        var data = JSON.parse(Assets.getText('pair.json'));
        if (Pairs.find().count() != data.length)
        {
            Pairs.remove({});
            for (i = 0; i < data.length; i++)
            {   
                    Pairs.insert({
                        source: data[i]['source'],
                        target: data[i]['target']
                    });
            }
        }
        
        var words = JSON.parse(Assets.getText('words.json'));
        if (Words.find().count() != words.length)
        {
            Words.remove({});
            for (i = 0; i < words.length; i++)
            {   
                
                    Words.insert({
                        word: words[i]['word'],
                        target: words[i]['target'],
                        distance: words[i]['distance']
                    });
            }
        }

        var songs = JSON.parse(Assets.getText('emotion_song_artist_songlink_list.json')); 
        if (Songs.find().count() != songs.length)
        {
            Songs.remove({});
            for (i = 0; i < songs.length; i++)
            {
                Songs.insert({
                    emotion: songs[i]['emotion'],
                    title: songs[i]['title'],
                    artist: songs[i]['artist'],
                    src: songs[i]['song_link']

                });
            }
        }
        
    });
	
	 
});

Meteor.methods({    
    addRequest: function (word)
    {
        
        var requests = Requests.find().fetch();
        
        var myGuests = [];
        console.log("length = " + requests.length);
        for (i = 0; i < requests.length; i++)
        {
            var pair1 = Pairs.find({"source": word, "target": requests[i]["emotion"]}).fetch()[0];
            var pair2 = Pairs.find({"source": requests[i]["emotion"], "target": word}).fetch()[0];

            if (pair1 || pair2)
            {
                console.log("i'm here");
                var updateGuests = Candidates.find({"host": requests[i]["username"]}).fetch()[0].guests;
                updateGuests.push(Meteor.user().username);
                Candidates.update({host: requests[i].username}, {host: requests[i].username, guests: updateGuests});

                myGuests.push(requests[i].username);
            }
        }
        
        Requests.insert({
            username: Meteor.user().username,
            emotion: word
        });
        
        Candidates.insert({
            host: Meteor.user().username,
            guests: myGuests
        });
    },
    
    deleteRequest: function ()
    {
        Requests.remove({
            username: Meteor.user().username,
        });
        var myGuests = Candidates.find({"host": Meteor.user().username}).fetch()[0].guests;
        Candidates.remove({host: Meteor.user().username});
        for (i = 0; i < myGuests.length; i++)
        {
            var updateguests = Candidates.find({"host": myGuests[i]}).fetch()[0].guests;
            index = updateguests.indexOf(Meteor.user().username);
            updateguests.splice(index, 1);
            Candidates.update({host: myGuests[i]}, {host: myGuests[i], guests: updateguests});
        }
    },

    logoutClean: function (user_name)
    {
        Requests.remove({
            username: user_name,
        });
        var myGuests = Candidates.find({"host": user_name}).fetch()[0].guests;
        Candidates.remove({host: user_name});
        for (i = 0; i < myGuests.length; i++)
        {
            var updateguests = Candidates.find({"host": myGuests[i]}).fetch()[0].guests;
            index = updateguests.indexOf(user_name);
            updateguests.splice(index, 1);
            Candidates.update({host: myGuests[i]}, {host: myGuests[i], guests: updateguests});
        }
    }

});

UserStatus.events.on("connectionLogout", function(fields){
   user_id = fields.userId;
   user_name = Meteor.users.find({'_id': user_id}).fetch()[0].username;
   Meteor.call("logoutClean", user_name);
}); 


