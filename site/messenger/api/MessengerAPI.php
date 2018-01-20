<?php
/**
 * Created by PhpStorm.
 * User: ari
 * Date: 1/19/2018
 * Time: 4:18 PM
 */

namespace Site\Messenger\API;


use Site\DB\Table\UserTokenRow;

class MessengerAPI
{
    function getAuthorizationKey() {
        return "AIzaSyCAt5-jWUZm44niJxq4c1PonrnQdJI0v-U";
    }

    function subscribeToTopic(UserTokenRow $Token, $topic) {
        $URL = "https://iid.googleapis.com/iid/v1/{$Token->getToken()}/rel/topics/$topic";
        $auth_key = $this->getAuthorizationKey();

        $ch = curl_init($URL);
        curl_setopt($ch, CURLOPT_CUSTOMREQUEST, "POST");
//        curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($params));
//        curl_setopt($ch, CURLOPT_HEADER  , true);  // we want headers
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_HTTPHEADER, array(
                "Content-Type: application/json",
                "Authorization: key=$auth_key",
                'Content-Length: 0', // . strlen($data_string))
        ));

        $result = curl_exec($ch);
        $httpcode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
//        echo $httpcode;
        if($httpcode !== 200)
            throw new \Exception($result);
    }
}

/**

POST https://fcm.googleapis.com/v1/projects/myproject-b5ae1/messages:send HTTP/1.1

Content-Type: application/json
Authorization: Bearer ya29.ElqKBGN2Ri_Uz...HnS_uNreA
{
"message":{
"topic" : "foo-bar",
"notification" : {
"body" : "This is a Firebase Cloud Messaging Topic Message!",
"title" : "FCM Message",
}
}
}


https://iid.googleapis.com/iid/v1/nKctODamlM4:CKrh_PC8kIb7O...clJONHoA/rel/topics/movies
Content-Type:application/json
Authorization:key=AIzaSyZ-1u...0GBYzPu7Udno5aA
 **/