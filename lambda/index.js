var Alexa = require('alexa-sdk');
const ets = process.env.twitter_secret;
let dts;
const etk = process.env.twitter_key;
let dtk;
console.log(JSON.stringify(process.env)); 
exports.handler = function(event, context, callback) {
    console.log(JSON.stringify(event));
    var alexa = Alexa.handler(event, context);
    alexa.appId = process.env.app_id; 
    alexa.resources = languageStrings;
    alexa.registerHandlers(handlers);
    alexa.execute();
};
var languageStrings = {
    'en': {
        'translation': {
            'WELCOME' : "Welcome to Fake News",
            'HELP'    : "This is fake news. Ask me, what did the president tweet on a certain day.",
            'ABOUT'   : "Get official statements from the President of the United States",
            'STOP'    : "That was low energy. <say-as interpret-as=\"interjection\">Sad!</say-as>"
        }
    }
};
var handlers = {
    'GetTweet': function() {
        var me = this;
        var lastindex = me.attributes.lastindex;
        var thisdate;
        if (this.event.request.intent.slots) this.event.request.intent.slots.date.value;
        if(!thisdate) thisdate = me.attributes.thisdate;
        else {
            me.attributes.lastindex = -1;
            this.attributes.thisdate = thisdate; 
        }
        if (typeof lastindex == "undefined") lastindex = -1; 
        getTweet({
            datetext: thisdate, 
            lastindex: lastindex,
            firsttext: this.attributes.firsttext,
            callback: function(tweet, newindex, newtweetchange) {
                console.log("Starting gettweet", tweet, "Bibble", newindex, "Stuff"); 
                if(tweet) {
                    var prepend  = "";
                    if(newtweetchange) {
                        prepend = "Fake News Alert! A new tweet follows: ";
                    }
                    if(newindex > -1) {
                        me.attributes.lastindex = newindex; 
                        if(newindex == 0) me.attributes.firsttext = tweet.text; 
                        me.emit(':ask', prepend + tweet.text + "\nWould you like to hear more?");
                    } else {
                        me.attributes.lastindex = -1;
                        me.attributes.thisdate = null;
                        me.emit(':tell', prepend + tweet.text + "\nAnd that was the last one. Sad!");
                    }
                } else {
                    me.attributes.lastindex = -1;
                    me.attributes.thisdate = null;
                    me.emit(":tell", "I found no tweets! People are appreciating this skill more and more.");
                }
            }
        }); 
    },
    'AMAZON.NoIntent': function () {
        this.emit(':tell', this.t('STOP'));
    },'NoIntent': function() {
        this.emit(':tell', this.t('STOP'));
    },
    'AMAZON.HelpIntent': function () {
        this.emit(':ask', this.t('HELP'));
    },
    'AMAZON.CancelIntent': function () {
        this.emit(':tell', this.t('STOP'));
    },
    'AMAZON.StopIntent': function () {
        this.emit(':tell', this.t('STOP'));
    },
    'AMAZON.YesIntent': function() {
        handlers.GetTweet.apply(this); 
    },
    'Unhandled': function () {
        this.emit(':ask', this.t("HELP"), this.t("HELP"));
    }
};
var Twitter = require('twitter'); 
var OAuth2 = require('oauth').OAuth2; 
var decryptVars = function(cb) {
    var finalCB = function() {
        if(dts && dtk) {
            cb();
        }
    }
    var AWS = require("aws-sdk");
    var kms = new AWS.KMS(); 
    kms.decrypt({ 
        CiphertextBlob: new Buffer(ets, 'base64') 
    }, (err, data) => {
        if (err) {
            console.log('Decrypt error:', err);
            return finalCB(err);
        } else {
            dts = data.Plaintext.toString('ascii');; 
            return finalCB();
        }
    });
    kms.decrypt({ 
        CiphertextBlob: new Buffer(etk, 'base64') 
    }, (err, data) => {
        if (err) {
            console.log('Decrypt error:', err);
            return finalCB(err);
        } else {
            dtk = data.Plaintext.toString('ascii');; 
            return finalCB();
        }
    });
}
var getToken = function(cb) {
    decryptVars(() => {
        var oauth2 = new OAuth2(
            dtk, 
            dts, 
            'https://api.twitter.com/', 
            null, 
            'oauth2/token', 
            null
        );
        oauth2.getOAuthAccessToken('', {
            'grant_type': 'client_credentials'
        }, function (e, access_token) {
            cb(access_token); 
        });
    });
}
var getTweet = function(args) {
    getToken(function(bearer) {
        if(!dts) {
            const kms = new AWS.KMS();
            

        }
        var client = new Twitter({
            consumer_key: dtk,
            consumer_secret: dts,
            bearer_token: bearer
        });
        var queryString = "from:realdonaldtrump -filter:retweets -filter:links";
        if(args.datetext) {
            var sinceString = "";
            var untilString = ""; 
            var Moment = require('moment'); 
            var ts = Moment(args.datetext); 
            while(ts.isAfter(Moment())) ts.subtract(1, "weeks");
            
            var until = Moment(ts).add(1, "days");
            sinceString = ts.format("YYYY-MM-DD");
            untilString = until.format("YYYY-MM-DD"); 
            console.log("Working with date range of", sinceString, untilString, "from " , args.datetext); 
            queryString = queryString + " since:" + sinceString + " until:"+ untilString;
        }
        client.get("search/tweets", {
            "q": queryString
        }, function(error, response) {
            if(!response || !response.statuses || !response.statuses.length || !response.statuses[0]) {
                args.callback(null, null);
                return;
            }
            if(typeof args.firsttext != "undefined") {
                var t = response.statuses[0];
                if(t.text != args.firsttext) {
                    //New winner!
                    args.callback(t, 0, true);
                }
            }
            if(args.lastindex > (response.statuses.length -2)) {
                args.callback(null, null);
            } else {
                console.log(response.statuses.length);
                var t = response.statuses[args.lastindex + 1];
                var newindex = -1 ;
                if(args.lastindex < (response.statuses.length -1)) newindex = args.lastindex + 1;
                args.callback(t, newindex); 
                return; 
            }
        });
    })
};