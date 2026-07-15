const express = require("express");
const fs = require("fs");
const session = require("express-session");
const passport = require("passport");
const DiscordStrategy = require("passport-discord").Strategy;

const config = require("./config");

const app = express();

const PORT = process.env.PORT || 3000;


// ======================
// Middleware
// ======================

app.use(express.json());
app.use(express.urlencoded({
    extended: true
}));


app.use(session({

    secret: "legacyzone-secret",

    resave: false,

    saveUninitialized: true

}));


app.use(passport.initialize());
app.use(passport.session());



app.use(express.static(__dirname));



// ======================
// Passport
// ======================


passport.serializeUser((user, done)=>{

    done(null, user);

});


passport.deserializeUser((user, done)=>{

    done(null, user);

});



passport.use(new DiscordStrategy({

    clientID: config.discordClientID,

    clientSecret: config.discordClientSecret,

    callbackURL: config.callbackURL,

    scope: [
        "identify"
    ]

},


(accessToken, refreshToken, profile, done)=>{

    done(null, profile);

}));

// ======================
// Database
// ======================

const database = "./database.json";


function getData(){

    return JSON.parse(
        fs.readFileSync(database, "utf8")
    );

}


function saveData(data){

    fs.writeFileSync(
        database,
        JSON.stringify(data, null, 2)
    );

}



// ======================
// Admin Check
// ======================

function isAdmin(req){

    if(!req.user){

        return false;

    }


    return config.admins.includes(
        req.user.id
    );

}



// ======================
// Discord Login
// ======================


app.get("/auth/discord",

passport.authenticate("discord")

);



app.get("/auth/discord/callback",
    passport.authenticate("discord", {
        failureRedirect: "/login.html"
    }),
    (req,res)=>{

        console.log("LOGIN SUCCESS");
        console.log(req.user);

        res.send("התחברת בהצלחה: " + req.user.username);

    }
);



// ======================
// Admin Page
// ======================


app.get("/admin",(req,res)=>{


    if(!isAdmin(req)){

        return res.redirect("/login.html");

    }


    res.sendFile(
        __dirname + "/admin.html"
    );


});



// ======================
// Logout
// ======================


app.get("/logout",(req,res)=>{


    req.logout(()=>{


        req.session.destroy(()=>{


            res.redirect("/login.html");


        });


    });


});

// ======================
// Events
// ======================


app.post("/api/events",(req,res)=>{


    if(!isAdmin(req)){

        return res.status(403).json({

            success:false

        });

    }


    const data = getData();


    data.events.push({

        id: Date.now(),

        title: req.body.title,

        date: req.body.date,

        time: req.body.time,

        location: req.body.location,

        prize: req.body.prize,

        description: req.body.description

    });


    saveData(data);


    res.json({

        success:true

    });


});



app.get("/api/events",(req,res)=>{


    const data = getData();


    res.json(data.events);


});



app.delete("/api/events/:id",(req,res)=>{


    if(!isAdmin(req)){

        return res.status(403).json({

            success:false

        });

    }


    const data = getData();


    data.events =
    data.events.filter(
        e => e.id !== Number(req.params.id)
    );


    saveData(data);


    res.json({

        success:true

    });


});




// ======================
// Updates
// ======================


app.post("/api/updates",(req,res)=>{


    if(!isAdmin(req)){

        return res.status(403).json({

            success:false

        });

    }



    const data = getData();



    data.updates.push({

        id: Date.now(),

        title:req.body.title,

        message:req.body.message,

        date:new Date()
        .toLocaleDateString("he-IL")

    });



    saveData(data);


    res.json({

        success:true

    });


});



app.get("/api/updates",(req,res)=>{


    const data = getData();


    res.json(data.updates);


});



app.delete("/api/updates/:id",(req,res)=>{


    if(!isAdmin(req)){

        return res.status(403).json({

            success:false

        });

    }



    const data = getData();


    data.updates =
    data.updates.filter(
        u => u.id !== Number(req.params.id)
    );


    saveData(data);


    res.json({

        success:true

    });


});




// ======================
// Start
// ======================


app.listen(PORT,()=>{

    console.log(
        `🚀 Server running on port ${PORT}`
    );

});