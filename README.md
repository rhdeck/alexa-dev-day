# alexa-dev-day
Sample Alexa Interaction Model and Back-End with Twitter Integration

Points of interest:

1) Uses slots to get the date of the tweet set you want read to you
2) Uses the Yes/No intents to read more - or stop. 
3) Saves the date and the offset from the first request so that further "yes" requests can just read off the next in the list
4) Uses environment variables for storing instance-specific information (twitter API keys and the alexa app id)
5) Uses Amazon KMS encryption for the twitter API keys, so that they are not in cleartext on the lambda management screen
6) Demos the inclusion of node_modules in the lambda. (necessary for the Twitter integration and using Moment for date manipulation)

Also includes upload.sh, which makes sending the updated lambda function a single click (or an up-enter combo for those of us who work that way)

Many thanks to the great Amazon people and my fellow Voice hackers for a great and educational day! 
