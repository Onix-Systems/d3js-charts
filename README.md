d3j charts
==========

REQUIREMENTS
------------
* PHP 5.4 and up
* apache

DIRECTORY STRUCTURE
-------------------
```
css/                stylesheet
fonts/              fonts
js/                 java script source files 

```
INSTALLATION
------------
1. Install the software that described in REQUIREMENTS
   * Mac 
        - check your apache work fine 
        - define new virtual host
        - configure php
     ```
         Guide link
         https://coolestguidesontheplanet.com/get-apache-mysql-php-phpmyadmin-working-osx-10-10-yosemite/
    
     ```
   
   * Windows 
       - download apache and php 
       - configure apache
       - configure php
     ```
         Guide link
         http://1stwebdesigner.com/local-web-server/
       
     ```
2. Configure /js/config.js 
    * Json URL

        in "json_url" type route to json file with data for charts

    * Config json

        in "config_json" type route to json file with config for charts display rules
