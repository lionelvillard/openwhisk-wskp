# `wskp` (aka `wsk+`)

`wskp` is a CLI wrapper around Apache OpenWhisk `wsk` with additional commands. Under the cover, `wskp` calls `wsk` to provide 100% `wsk` compatibility.

## Installing

This project hasn't been published yet. To get started do:

```bash
$ git clone git@github.ibm.com:villard/wskp.git
$ cd wksp
$ bin/install.sh
$ wskp --help

Usage: wskp <command> [options]
...
```

## `.wskprops`

`wsk` configuration parameters (i.e. `AUTH`, `APIHOST`, ...) are stored in a file called `.wskprops`. The value of these parameters is resolved as follows:
1. value specified on the CLI (i.e. `-u`)
1. the value stored in `$WSK_CONFIG_FILE`
1. `wskp` only: the value stored in `.wskprops` located in the current directory. If no `.wskprops` exists, look in the parent directory until reaching the user home directory 
1. `wsk` only: the value stored in `.wskprops` located in the user home directory

## Commands

- [wskp update](#wskp-update): check for update 
- [wskp project](#wip-wskp-project): work with project
- [wskp env](#wip-wskp-env): work with deployment environment
- [wskp yo](#wskp-yo): stub generator

### `wskp update`

Check for the `wskp` and `wsk` updates.

### WIP: `wskp env`

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

### WIP: `wskp project`

Work with project. A project is a collection of OpenWhisk entities and environments.

- [wskp project sync](#wskp-project-sync): synchronize project with local resources
- [wskp project refresh](#wskp-project-refresh): synchronize project with deployed resources
- [wskp project deploy](#wskp-project-deploy): deploy project

#### `wskp project sync`

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

#### `wskp project refresh`

Export all OpenWhisk entities deployed in the current environment to a bash script.

#### `wskp project deploy`

Deploy project to OpenWhisk   


### `wskp yo`

Builtin stub generator based on [yeoman](http://yeoman.io/).

- [wskp yo action](#wskp-yo-action): generate an action

#### `wskp yo action`

Generate an action.

The package and action names are inferred by analyzing the current directory structure (see [sync](#wskp-project-sync)).



