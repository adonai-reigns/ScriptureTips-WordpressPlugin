<?php

/* 
 * @package Adonai Reigns 
 */


/*
Copyright (C) 2019  www.Adonai-Reigns.life

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License
along with this program.  If not, see <https://www.gnu.org/licenses/>.
*/

if ( ! defined( 'ABSPATH' ) ) {
    exit();
}

class Adonai_Reigns_life_Update
{
    /**
     * Automatically update the booklet every x seconds
     */
    protected static $auto_update_interval = 86400 * 7;
    
    /**
     * Force the content to be updated.
     */
    public static function force_content_update(){
	delete_option('the_gospel_content');
	return self::auto_content_update();
    }
    
    /**
     * Check to see whether the content might possibly be stale and then update the content if there is newer content available
     * This should be called by a cron service daily
     * @return type
     */
    public static function auto_content_update($lang = 'en_nz'){
	
	$last_update = get_option('the_gospel_content_'.$lang);
	
	if(!is_object($last_update)){
	    // this is probably a fresh install or something has gone wrong with our data to that effect
	    require_once(plugin_dir_path(ADONAI_REIGNS_PLUGIN_FILE) . DIRECTORY_SEPARATOR . 'assets' . DIRECTORY_SEPARATOR . 'default-content' . DIRECTORY_SEPARATOR . 'init.php');
	    $last_update = new stdClass();
	    $last_update->version = '0.0.0';
	    $last_update->updated_timestamp = 0;
	    $last_update->gospel_booklet_width = 400;
	    $last_update->gospel_booklet_height = 600;
	    
	}else{
	    // preserve some values that are site configurations
	    $preserved_options = array();
	    $preserved_options['gospel_booklet_width'] = $last_update->gospel_booklet_width;
	    $preserved_options['gospel_booklet_height'] = $last_update->gospel_booklet_height;
	}
	
	if($last_update->updated_timestamp + self::$auto_update_interval > time()){
	    // no need to update, the content is assumed current
	    return;
	}
	
	// @TODO : they should be able to opt-in to receive updates to the booklet content from the CDN
	$init_json_encoded = null;
	if(false){
	    try{
		$init_json_encoded = @file_get_contents(ADONAI_REIGNS_CDN_URL . DIRECTORY_SEPARATOR . 'content-latest.json');
		$init_json_decoded = json_decode($init_json_encoded);
	    } catch (Exception $ex) {
		// silent fallback
		$init_json_encoded = null;
	    }
	}
	
	
	if(is_object($init_json_decoded) && version_compare($init_json_decoded->version, $adonai_reigns_autoupdate_init_content->version, 'gt')){
	    // we shall use the content from the cdn, because it is newer than the plugin's default content
	    $adonai_reigns_autoupdate_init_content = $init_json_decoded;
	}
        
	if(version_compare($adonai_reigns_autoupdate_init_content->version, $last_update->version, 'gt')){
	    // we need to store the data to the WP options
	    
	    // restore the preserved options
	    if(isset($preserved_options)){
		foreach($preserved_options as $k=>$v){
		    $adonai_reigns_autoupdate_init_content->$k = $v;
		}
	    }
	    
	    $adonai_reigns_autoupdate_init_content->updated_timestamp = time();
	    update_option('the_gospel_content', $adonai_reigns_autoupdate_init_content);
	
	}
	
	
    }
}

