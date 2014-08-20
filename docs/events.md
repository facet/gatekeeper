# Gatekeeper event system

All facet modules emit events when their functions are invoked. The event system is used as a means of communication both internally and with other modules listening for the appropriate events. 

Gatekeeper emits the following events on the intercom instance:

* 
* **facet:response:error**
* **facet:response:user:data**

It listenens for the following events on the intercom instance:

* facet:check:access
* facet:user:data
* facet:auth:api:done