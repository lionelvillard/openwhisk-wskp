[![Build Status](https://travis-ci.org/lionelvillard/openwhisk-wskp.svg?branch=master)](https://travis-ci.org/lionelvillard/openwhisk-wskp)

# `wskp` (aka `wsk+`)

`wskp` is a CLI wrapper around Apache OpenWhisk `wsk` with additional commands. Under the cover, `wskp` calls `wsk` to provide 100% `wsk` compatibility.

## Installing


```bash
$ npm install openwhisk-wskp -g
$ wskp

Usage: wskp <command> [options]
...
```

## `.wskprops`

`wskp` configuration parameters (i.e. `AUTH`, `APIHOST`, ...) are stored in a file called `.wskprops`. The value of these parameters is resolved as follows:
1. value specified on the CLI (i.e. `-u`)
1. value specified in the environment (`$AUTH`, `$APIHOST`, ...)
1. the value stored in `$WSK_CONFIG_FILE`
1. the value stored in `.wskprops` located in the current directory. If no `.wskprops` exists, look in the parent directory until reaching the user home directory 

## Commands

- [wskp update](#wskp-update): check for update 
- [wskp env](#wskp-env): work with deployment environment
- [wskp deploy](#wskp-deploy): deploy project to OpenWhisk.
- [wskp undeploy](#wskp-undeploy): undeploy project 
- [wskp refresh](#wskp-refresh): update project description with deployed entities 
- [wskp wipe](#wskp-wipe): remove all entities from the project namespace(s)
- [wskp yo](#wskp-yo): stub generator

### `wskp update`

Check for the `wskp` and `wsk` updates.

### `wskp env`

Work with environments.

A deployment environment consists of a name and a set of variables. Each environmnent is persisted in `.<env>.wskprops` in the project root directory. The current resolved environment in stored in `.wskprops` (don't *not* commit this file).

`wsk` supports these variables:
- `AUTH`, `WHISK_AUTH`: the OpenWhisk authentication key
- `APIHOST`, `WHISK_APIHOST`: the OpenWhisk host 
- `CERT`: 
- `KEY`:
- `NAMESPACE`, `WHISK_NAMESPACE`
- `APIVERSION`, `WHISK_APIVERSION`:

In addition, `wskp` supports these variables:
- `BLUEMIX_SPACE`: a Bluemix space used to computed `AUTH`  

#### `wskp env list`

List all environments for the current project

#### `wskp env set <envname>`

Set the current environment to `<envname>`. Resolve missing environment variables when needed.


### `wskp deploy`

Deploy project to OpenWhisk.

```bash
Usage: wskp deploy [options] <openwhisk.yml>
  
Command Options:

-m, --mode [mode]      deployment mode (create|update) [create]
```  

### `wskp undeploy`

Undeploy project.

```bash
Usage: wskp undeploy [options] <openwhisk.yml>
```  

### `wskp refresh`

Update the project description with deployed entities.

```bash
Usage: wskp refresh [options]
  
Command Options:

-f <format>, --format <format>]  output format (bash|yaml) [yaml]
```  

### `wskp sync`


Update the deployment configuration based on the current directory structure.

This commands scans the following directories:

    |- actions
       |- <action-name>
          <action>.js or <package.json>
       action-name.js
    |- packages
      |- <package-name>
         |- <action-name>
            <action>.js or <package.json>
         action-name.js


### `wskp yo`

Builtin stub generator based on [yeoman](http://yeoman.io/).

- [wskp yo action](#wskp-yo-action): generate an action


#### `wskp yo action`

Generate an action.

The package and action names are inferred by analyzing the current directory structure (see [sync](#wskp-project-sync)).


# Development

```bash
$ https://github.com/lionelvillard/openwhisk-wskp
$ cd openwhisk-wskp
$ npm i
```

To run the tests, it is recommended to create the file `.wskprops` in the project root directory. Then do:

```bash
$ npm test
```

