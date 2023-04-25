# Family companion

Simple task manager addon for Home assistant
TDB

# Installation

Add this repository to your addon repositories. Family companion should be avaialble.

Installation will take some time as this will compile the solution from source code. For now at least, it can take 20 minutes on my RPI 4.

# Documentation

## Task trigger

A task will be triggered if it has a CRON string (look on google for what it is) or if HA triggers an event "trigger_task" with as parameter

```
{
  id: "task_id"
}
```

When creating task, please provide meaning full but HA compliant ids like "clean_dishes_in_kitchen".

## Events

This addon will trigger events in HA in order for you to automate actions.

### task_triggered

This event is triggered when a task is triggered either with CRON or HA event

Parameter:

```json
{
  "task": {}, // Task triggered
  "job": {} // Resulting job to fullfil
}
```

### task_completed / task_canceled

This event is triggered when a task has been completed / canceled through a notification action

Parameter:

```json
{
  "task": {}, // Task triggered
  "job": {}, // Job related to the action,
  "person": "person.someone" // Person triggering the action
}
```

## Notification

This addon is deeply integrated with companion app. Each person should set there companion app name to their person name example:
user Paul, is an entity Person with id person.paul. It should have a service called mobile_app_paul.

To do, go in the companion app settings, select the server, change the name. Reboot the companion app, it'll trigger the new service.

Notifications have actions in order to complete or cancel them. This will allow the addon to follow who did what and when.

## Translations

None yet. TBD

# Contributing

I'll review PR for now (2023-04-27).
