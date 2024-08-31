# css-google-auth

Components for Google authentication in CommunitySolidServer.

## Running the Community Solid Server with css-google-auth

At first, setup OAuth 2.0 at Google API Console.

* Google API Console: <https://console.developers.google.com/>
* Documents of Google OpenID Connect: <https://developers.google.com/identity/openid-connect/openid-connect>

The redirect uri should be `${Root of CommunitySolidServer}/.account/google/oidc/`.
Then create a directory for your project. And create a file named `google-auth.json` in your project directory.

```
{
  "@context": [
    "https://linkedsoftwaredependencies.org/bundles/npm/@solid/community-server/^7.0.0/components/context.jsonld",
    "https://linkedsoftwaredependencies.org/bundles/npm/css-google-auth/^2.0.0/components/context.jsonld",
  ],
  "import": [
    "cga:config/google-auth.json"
  ],
  "@graph": [
    {
      "@id": "urn:cga:core:MyOverride1",
      "@type": "Override",
      "overrideInstance": { "@id": "urn:cga:core:GoogleOIDC" },
      "overrideParameters": {
        "@type": "GoogleOIDC",
        "client_id": "Maybe a string that has 71 characters, and ends with apps.googleusercontent.com .",
        "client_secret": "Maybe a string that has 24 characters."
      }
    }
  ]
}
```

In your project directory, execute bellow commands.

```
npm init -y
npm install @solid/community-server css-google-auth openid-client
npx community-solid-server -c @css:config/file.json google-auth.json -f data -m .
```

The CommunitySolidServer will start at `http://localhost:3000/`.
Create an account, then go to your account page.
It will contain the link "Add Google Account".

## Customize css-google-auth

The CommunitySolidServer is developed using `Components.js`.

* <https://componentsjs.readthedocs.io/en/latest/>

If you need to configure css-google-auth,
you can use following 2 interfaces. 

* GoogleAuthFilter
    + If you need to filter accounts that can register
      to your server, make a class implementing this
      interface, and exchange DefaultGoogleAuthFilter
      to it. You can reject by throwing
      an exception in your implementation.
* PostGAccountGen
    + If you need to execute some processes after adding
      google authentication login, you can implement
      this interface, and exchange DefaultPostGAccountGen
      to your implementation.
