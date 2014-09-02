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
2. run `npm install facet-gatekeeper --save` in your project's root directory

You'll likely want to secure some or all of your API. To setup your first API user  run `node install` and answer the prompts.

Set `GatekeeperAPI.apiAuthMiddleware()` to be used by your app/router. If you're creating an express app, you can do so by adding `app.use(GatekeeperAPI.apiAuthMiddleware());`. Be sure to include that middleware call before declaring/binding any routes you wish to restrict access to.

If you don't want to require api authentication for usage you should instead use `GatekeeperAPI.facetInit()` to initialize the module with the request lifecycle objects. The facetInit() function is available to all facet modules and only needs to be used once, regardless of the number of facet modules in use. 


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
