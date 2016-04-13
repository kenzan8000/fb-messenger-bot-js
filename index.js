var bodyParser = require('body-parser');
var express = require('express');
var request = require('request');
var app = express();



app.set('port', (process.env.PORT || 5000));
app.listen(app.get('port'));
app.use(bodyParser.json());


app.get('/', function(req, res) {
    console.log(req);
    res.send('It works!');
});


app.get('/facebook/', function(req, res) {
    if (req.param('hub.verify_token') == (process.env.FB_VERIFY_TOKEN || ENV["FB_VERIFY_TOKEN"])) {
        res.send(req.param('hub.challenge'));
    }
    else {
        res.sendStatus(400);
    }
});

app.post('/facebook/', function (req, res) {
    messaging_events = req.body.entry[0].messaging;
    for (i = 0; i < messaging_events.length; i++) {
        event = req.body.entry[0].messaging[i];
        sender = event.sender.id;
        if (event.message && event.message.text) {
            text = event.message.text.substring(0, 200);



            request({
                url: 'https://api.api.ai/api/query',
                qs: {"Authorization":"Bearer "+(process.env.API_AI_ACCESS_TOKEN || ENV["API_AI_ACCESS_TOKEN"])},
                params: {"lang":"en", "timezone":"America/Los_Angeles", "v":"20150910", "query":text},
                method: 'GET'
            },
            function(error, response, body) {
                if (error) {
                    console.log('Error sending message: ', error);
                }
                else if (response.body.error) {
                    console.log('Error: ', response.body.error);
                }
                else {



                    text = response['result']['fulfillment']['speech'];
                    request({
                        url: 'https://graph.facebook.com/v2.6/me/messages',
                        qs: {"access_token":(process.env.FB_ACCESS_TOKEN || ENV["FB_ACCESS_TOKEN"])},
                        method: 'POST',
                        json: {
                            "recipient":{"id":sender},
                            "message":{"text":text}
                        }
                    },
                    function(error, response, body) {
                        if (error) {
                            console.log('Error sending message: ', error);
                        }
                        else if (response.body.error) {
                            console.log('Error: ', response.body.error);
                        }
                    });



                }

            });

/*
            request({
                url: 'https://graph.facebook.com/v2.6/me/messages',
                qs: {"access_token":(process.env.FB_ACCESS_TOKEN || ENV["FB_ACCESS_TOKEN"])},
                method: 'POST',
                json: {
                    "recipient":{"id":sender},
                    "message":{"text":text}
                }
            },
            function(error, response, body) {
                if (error) {
                    console.log('Error sending message: ', error);
                }
                else if (response.body.error) {
                    console.log('Error: ', response.body.error);
                }
            });
*/


        }
    }
    res.sendStatus(200);
});



app.listen();
