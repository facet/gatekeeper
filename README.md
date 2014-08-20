**This module is currently in alpha and not suitable for production use. See the TODO section for details on missing functionality**

# gatekeeper


Gatekeeper is a Node.js and MongoDB authentication and role based access control system. Key features are:

* framework agnostic but exposes middleware functions that integrate easily with existing frameworks (such as ExpressJS, Koa and Flatiron). **alpha note: only express style middleware is currently supported**
* provides API authentication via basic auth or JSON web tokens (jwt)
* provides customer/account authentication
* exposes robust schemas that include custom data fields
* optionally extend users and roles with custom permission levels per action
* decoupled, event driven communication between modules allowing custom replacements to be dropped in
* support for multi tenant applications

When combined with other Facet modules (such as response and catalog) fully featured JSON APIs can be exposed out of the box with no customization required.

There are two main ways of using this module:

1. In auto route binding mode, resulting in complete CRUD JSON web service out of the box.
2. As a standalone library in custom piecemeal integrations (no auto route binding).


## Examples

### Auto route binding

coming soon...


### Standalone usage

coming soon...


## Setup

The following steps will get gatekeeper running locally:

1. [Install mongodb](http://docs.mongodb.org/manual/installation/) and start the service. 
2. run `npm install facet-gatekeeper` in your project's root directory

You'll likely want to secure some or all of your API. To do so first create an api user through the mongo shell. You can typically do so with the following two commands:

`use <your database name>`

`db.users.insert({ "username" : "apiadmin", "password" : "change_me", "api_key" : "change_me_too", "permissions" : [ { "action" : "*", "level" : 1 } ] })`

You'll obviously want to change `<your database name>`, `change_me` and `change_me_too`. The api_key field is only required if you want to use basic auth. See [configuration section](#configuration) for setting the auth method.

Set `GatekeeperAPI.apiAuthMiddleware()` to be used by your app/router. If you're creating an express app, you can do so by adding `app.use(GatekeeperAPI.apiAuthMiddleware());`. Be sure to include that middleware call before declaring/binding any routes you wish to restrict access to.


## Configuration
[See docs.](https://github.com/facet/gatekeeper/tree/master/docs/config.md)

## API

### Events emitted/subscribed to

[See docs.](https://github.com/facet/gatekeeper/tree/master/docs/events.md)

### CRUD functions

[See docs.](https://github.com/facet/gatekeeper/tree/master/docs/crud.md)



## Overriding default functionality
coming soon



TODO
----------------
* bug fixes
* write middleware for koa and flatiron
* implement password retrieval
* implement oauth
* finish writing unit tests
* provide sample applications
