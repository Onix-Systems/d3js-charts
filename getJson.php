<?php
$json = file_get_contents($_GET['url']);
print_r($json);
/* if($_GET['url']){
    $ch = curl_init($_GET['url']);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    $json = '';
    if( ($json = curl_exec($ch) ) === false)
    {
        print_r('Curl error: ' . curl_error($ch));
    }
    else
    {
        print_r($json);
    }
    curl_close($ch);
}else{
    print_r('Url is required');
}
*/
?>
