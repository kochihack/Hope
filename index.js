var MongoClient = require('mongodb').MongoClient;
var url = "mongodb://localhost:27017/";

var uuid = require('uuid');
var express = require('express');
var app = express();
var multer  = require('multer')
var upload = multer({ dest: 'uploads/' });
var AWS = require('aws-sdk');
var config = require('./config.js')
AWS.config.region = config.region;

var uuid = require('node-uuid');
var fs = require('fs-extra');
var path = require('path');


app.use(express.static('public'));
var rekognition = new AWS.Rekognition({region: config.region});

MongoClient.connect(url,{ useNewUrlParser: true }, function(err, db) {
    if (err) throw err;
    var dbo = db.db("hope");


app.get('/', function(req,res)
{
    res.sendFile(__dirname +'/public/index.html');
});

app.post('/api/recognize', upload.single("image"), function (req, res, next) {
    
    var bitmap = fs.readFileSync(req.file.path);

    
	rekognition.searchFacesByImage({
	 	"CollectionId": config.collectionName,
	 	"FaceMatchThreshold": 70,
	 	"Image": { 
	 		"Bytes": bitmap,
	 	},
	 	"MaxFaces": 1
	}, function(err, data) {
	 	if (err) {
	 		res.send(err);
	 	} else {

			if(data.FaceMatches && data.FaceMatches.length > 0 && data.FaceMatches[0].Face)
			{
                // res.send(data.FaceMatches[0].Face.ExternalImageId)
                var query = { name: data.FaceMatches[0].Face.ExternalImageId };
				dbo.collection("cases").find(query).toArray(function(err, result) {
                    if (err) throw err;
                    console.log(result);
                    // db.close();
                    res.send(result);
                    
                  });
			} else {
                var myu={message : "Not Recognized"};
                db.close();
				res.send(myu);
			}
		}
	});
});



app.post('/api/upload', upload.single("image"), function (req, res, next) {
    var bitmap = fs.readFileSync(req.file.path);
    var name=req.body.name
    var myobj = { name: req.body.name, gender: req.body.name, age: req.body.age,phone: req.body.phone  };


    dbo.collection("cases").insertOne(myobj, function(err, result) {
        if (err) throw err;

        rekognition.indexFaces({
            "CollectionId": config.collectionName,
            "DetectionAttributes": [ "ALL" ],
            "ExternalImageId": name,
            "Image": { 
               "Bytes": bitmap
            }
         }, function(err, data) {
             if (err) {
                 console.log(err, err.stack); // an error occurred
                 console.log("Error")
                //   db.close();
             } else {
                 console.log("Success!")
                 console.log(data);           // successful response
                //  db.close();
                 res.send('Submitted Successfully');
             }
         });
        

        
      });

    
});



app.post('/api/test', upload.single("image"), function (req, res, next) {
    console.log(req)
    
});




app.listen(5555, function () {
	console.log('Listening on port 5555');
})

});