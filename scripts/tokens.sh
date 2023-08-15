#!/usr/bin/env bash

users=(
Z2lkOi8vc3RvZWdlL0FkbWluLzc4Ng==.usr.foxford.ru
Z2lkOi8vc3RvZWdlL0FkbWluLzc4Nw==.usr.foxford.ru
Z2lkOi8vc3RvZWdlL0FkbWluLzc4OA==.usr.foxford.ru
Z2lkOi8vc3RvZWdlL0FkbWluLzc4OQ==.usr.foxford.ru
Z2lkOi8vc3RvZWdlL0FkbWluLzc5MA==.usr.foxford.ru
Z2lkOi8vc3RvZWdlL0FkbWluLzc5MQ==.usr.foxford.ru
Z2lkOi8vc3RvZWdlL0FkbWluLzc5Mg==.usr.foxford.ru
Z2lkOi8vc3RvZWdlL0FkbWluLzc5Mw==.usr.foxford.ru
Z2lkOi8vc3RvZWdlL0FkbWluLzc5NA==.usr.foxford.ru
Z2lkOi8vc3RvZWdlL0FkbWluLzc5NQ==.usr.foxford.ru
)

total=${#users[*]}

for (( i=0; i<$total; i++ ))
do
  svc-authn-cli sign --account-id ${users[i]}
done
