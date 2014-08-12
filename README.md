**This module is currently in alpha. See the TODO section for details on missing functionality**

gatekeeper
==========

Gatekeeper is a Node.js and MongoDB authentication and role based access control system. Key features are:

* framework agnostic but exposes middleware functions that integrate easily with existing frameworks (such as ExpressJS, Koa and Flatiron). **alpha note: only express style middleware is currently supported**
* provides API authentication via basic auth or JSON web tokens (jwt)
* provides customer/account authentication
* exposes robust schemas that include custom data fields
* optionally extends users and roles with custom permission levels per action
* decoupled, event driven communication between modules allowing custom replacements to be dropped in

When combined with other Facet modules (such as response and catalog) fully featured JSON APIs can be exposed out of the box with no customization required.

There are two main ways of using this module:

1. In auto route binding mode, resulting in complete CRUD JSON web service out of the box.
2. As a standalone library in custom piecemeal integrations (no auto route binding).


Auto route binding
------------------
coming soon...


Standalone usage
----------------
coming soon...


TODO
----------------
* write middleware for koa and flatiron
* implement password retrieval
* implement oauth
* finish writing unit tests
* provide sample applications
