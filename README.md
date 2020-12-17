# XSD Validator example

If you want to use Apigee to validate an XML message against an XML Schema
(.xsd), you can use the MessageValidation policy.

A special case of that is when you want to validate a SOAP message, including both the
internals of the SOAP Header and the internals of the SOAP Body.

But the same principle applies to any XML message.
This apiproxy example demonstrates.

## Design

The main requirement is to configure the MessageValidator policy to use an XSD. Like this:
```xml
<MessageValidation name="MV-XSD-1">
  <Source>request</Source>
  <ResourceURL>xsd://soap-example.xsd</ResourceURL>
</MessageValidation>
```

The example.xsd is the schema that defines the message strictly. For a SOAP message like this:

```xml
<soap12:Envelope xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
                 xmlns:soap12="http://www.w3.org/2003/05/soap-envelope">
  <soap12:Header>
    <AuthSOAPHeader xmlns="urn://HeaderNamespace">
      <MoreHeaderElementsHere/>
    </AuthSOAPHeader>
  </soap12:Header>
  <soap12:Body>
    <SoapMethodName xmlns="urn://MethodNamespace">
      <Other ElementsofBODY='foo'/>
    </SoapMethodName>
  </soap12:Body>
</soap12:Envelope>

```

...the XSD would be:

```xml
<xs:schema xmlns:xs="http://www.w3.org/2001/XMLSchema"
           elementFormDefault="qualified"
           targetNamespace="http://www.w3.org/2003/05/soap-envelope"
           xmlns:header="urn://HeaderNamespace"
           xmlns:body="urn://MethodNamespace"
           xmlns:soap12="http://www.w3.org/2003/05/soap-envelope">

  <xs:import namespace="urn://HeaderNamespace" schemaLocation="xsd://soap-header-child.xsd"/>
  <xs:import namespace="urn://MethodNamespace"
             schemaLocation="xsd://soap-body-child.xsd"/>

  <xs:element name="Envelope">
    <xs:complexType>
      <xs:sequence>
        <xs:element name='Header' type="soap12:soapHeader" minOccurs='0'/>
        <xs:element name='Body'   type="soap12:soapBody"/>
      </xs:sequence>
    </xs:complexType>
  </xs:element>

  <xs:complexType name="soapHeader">
    <xs:sequence minOccurs="0" maxOccurs="1">
      <xs:element ref="header:AuthSOAPHeader"/>
    </xs:sequence>
  </xs:complexType>

  <xs:complexType name='soapBody'>
    <xs:sequence>
      <xs:element ref="body:SoapMethodName"/>
    </xs:sequence>
  </xs:complexType>

</xs:schema>
```

...with the inner XML of the header and body defined by the respective subsidiary XSDs.


## Can you Generate an XSD from an XML

Given the XML, how is it possible to obtain a valid XSD?  I used [a free online XSD-inference tool](http://xml.mherman.org/index.php/trang/generate).
But this is not foolproof.  The first pass will generate an XSD that refers to external schema (ns1 and ns2 for Header and Body).  So you may need to run the XSD generator tool iteratively until all schema are satisfied.


## Running the demonstration

First, you need to deploy the API Proxy to an Apigee organization+environment. Then you can invoke it.
Included here are [various sample payloads](./sample-payloads).

To demonstrate the validation, you can use curl:

```
curl -i -H content-type:application/soap+xml \
    https://$ORG-$ENV.apigee.net/xsd-validator/t1 \
    -d @sample-payloads/valid-soap-with-header.xml

```

The response should be:
```
HTTP/1.1 200 OK
Date: Thu, 14 Dec 2017 20:27:24 GMT
Content-Type: application/json
Content-Length: 23
Connection: keep-alive

{
    "status" : "ok"
}
```

And here's an example of validating with an incorrect body element:

```
curl -i -H content-type:application/soap+xml \
    https://$ORG-$ENV.apigee.net/xsd-validator/t1 \
    -d @sample-payloads/broken--wrong-body-element.xml

```

The response for this one should be:
```
HTTP/2 400
content-type: application/json
content-length: 402
date: Thu, 17 Dec 2020 22:42:39 GMT

{
  "Envelope": {
    "Body": {
      "Fault": {
        "Code": {
          "Value": "env:Receiver",
          "Subcode": {
            "Value": "steps.messagevalidation.Failed"
          }
        },
        "Reason": {
          "Text": {
            "lang": "en",
            "": "MV-XSD-1 failed with reason: \"Element name mismatch. Wildcard? [Line 1]\""
          }
        }
      }
    }
  }
}

```

You could do similar invocations with Postman or other GUI tools.

Note: The MessageValidation policy checks the content-type header of the
request, and will skip validation if it is not set. Therefore you should always
validate the header prior to invoking the MessageValidation policy.  You can do
this with a `Condition` and a `RaiseFault` policy, like so:

```
      <Request>
        <Step>
          <Name>RF-WrongContentType</Name>
          <Condition>request.header.content-type != "application/soap+xml"</Condition>
        </Step>
        <Step>
          <Name>MV-XSD-1</Name>
        </Step>
      </Request>
```

The example bundle here does this.



## Disclaimer

This is example code. This is not part of any Google product.
There is no warranty associated to this example.

## License

This example is Copyright 2017-2020 Google LLC, and [is licensed](./LICENSE)
under the Apache 2.0 source license.