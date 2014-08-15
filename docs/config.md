# Gatekeeper config

Configuration is in the form of a settings object that gets passed to gatekeeper constructor. The following options are available:

#### db - required

An instance of mongoose that has been configured to use your desired connection details. 

#### intercom - required

An instance of `facet-intercom`. Intercom is used as an event aggregator as a means of decoupled inter-module communication. All facet modules emit a some number of requests per invokation. See the list of events emitted by this module.


#### container_id - optional

type: string - should be a valid string representation of a mongo ObjectId.

In multi tenant applications you will want to silo resources. Facet modules use a shared schema method so the container_id (and app_id) fields are provided. This allows for each tenant to run multiple apps and share data among them.

#### app_id - optional

type: string - should be a valid string representation of a mongo ObjectId.

Intended for multi tentant applications where each tenant can run multiple APIs.

#### apiAuthMethod - optional

type: string <'basic' | 'jwt'>, defaults to `basic`

Determines what type of API auth method to use. `basic` looks for an api key in the following places: 

* a base64 encoded api key in the `Authorization` header (most common)
* an `apikey` field in the query string
* an `apikey` field in the request body

`jwt` expects an api token to be present in one of the following:

* passed as the value of the `x-access-token` header
* an `access_token` field in the query string
* an `access_token` field in the request body

#### middlewareType - optional

type: string <'connect' | 'express' | 'koa' | 'flatiron'>, defaults to `connect`

Determines which middleware functions to use. Note that `express` is the same as `connect`.