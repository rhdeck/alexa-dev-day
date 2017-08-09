#!/bin/sh
cd lambda
zip -r /tmp/bob.zip *
# Note that for this to work you will need to install aws-cli (pip install aws-cli)
# Also note that you will need the ARN of the Lambda slot. The one here is... not yours. 
aws lambda update-function-code --function-name arn:aws:lambda:us-east-1:210049126456:function:twitterbot --zip-file fileb:///tmp/bob.zip
rm /tmp/bob.zip
