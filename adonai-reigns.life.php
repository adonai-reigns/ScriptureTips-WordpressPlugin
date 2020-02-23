<?php

/* 
 * @package Adonai Reigns 
 */


/*
Plugin Name: Adonai Reigns 
Plugin URI: https://www.adonai-reigns.life/tools/wordpress
Description: Share The Gospel to visitors of your website!
Version: 1.0.0
Author: Serving Zion
Author URI: http://www.adonai-reigns.life
License: GPLv2 or later
Text Domain: adonai-reigns.life
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

if(!defined('ADONAI_REIGNS_PLUGIN_FILE')){
    define('ADONAI_REIGNS_PLUGIN_FILE', __FILE__);
    define('ADONAI_REIGNS_CDN_URL', 'https://static.adonai-reigns.life/wordpress-plugin-cdn');
}

if(!class_exists('Adonai_Reigns_Life')){

    class Adonai_Reigns_Life
    {
	
	public $pluginBasename;
	public $pluginSlugname = 'adonai_reigns_life';
	
	/**
	 * These are public hooks for content authors to use
	 */
	public function add_shortcodes(){
	    // add the required scripts to the head (CSS & JavaScript files in the head section)
	    add_shortcode('adonai_reigns_life_gospel_page_content', array($this, 'get_page_content'));
	    
	    // add the required page scripts (place before closing body tag - this will initialize the booklet when document.ready is fired)
	    add_shortcode('adonai_reigns_life_gospel_page_script', array($this, 'get_page_script'));
	    
	    // this creates the code for the booklet to be displayed on the page in one shortcode
	    add_shortcode('the_gospel_booklet', array($this, 'get_the_gospel_booklet'));
	    
	}
	
	
	
	
	public function __construct(){
	    $this->pluginBasename = plugin_basename(__FILE__);
	    $this->add_shortcodes();
	}

	
	
	public function add_admin_pages(){
	    add_menu_page('Adonai Reigns Life Page', 'Adonai Reigns', 'manage_options', $this->pluginSlugname, array($this, 'admin_index'), 'dashicons-admin-generic', 110);
	}
	
	public function admin_index(){
	    require_once(plugin_dir_path(__FILE__).'templates/admin.php');
	}
	
	public function settings_link($links){
	    $settings_link = '<a href="admin.php?page='.$this->pluginSlugname.'">Settings</a>';
	    array_push($links, $settings_link);
	    return $links;
	}
	
	public function register(){
	    add_action('admin_enqueue_scripts', array('Adonai_Reigns_Life', 'enqueue'));
	    add_action('wp_enqueue_scripts', array('Adonai_Reigns_Life', 'enqueue'));
	    add_action('admin_menu', array($this, 'add_admin_pages'));
	    add_filter("plugin_action_links_{$this->pluginBasename}", array($this, 'settings_link'));
	    
	}
	
	public function replace_content_variables($content){
	    
	    $adonai_reigns_autoupdate_init_content = get_option('the_gospel_content');
	    
	    $searches = array(
		'__ADONAI_REIGNS_LIFE_PLUGINS_ASSETS_URL__',
		'__ADONAI_REIGNS_LIFE_HOMEPAGE_URL__',
		'__ADONAI_REIGNS_LIFE_HOMEPAGE_NAME__',
		'__ADONAI_REIGNS_LIFE_GOSPEL_BOOKLET_CONFIG_HEIGHT__',
		'__ADONAI_REIGNS_LIFE_GOSPEL_BOOKLET_CONFIG_WIDTH__'
	    );
	    
	    $replacements = array(
		plugins_url('assets', __FILE__),
		site_url(),
		get_bloginfo('name'), // @todo: site name
		$adonai_reigns_autoupdate_init_content->booklet_height,
		$adonai_reigns_autoupdate_init_content->booklet_width
	    );
	    
	    return str_replace($searches, $replacements, $content);
	    
	}
	
	
	
	public function get_the_gospel_booklet(){
	    return $this->get_page_content() . $this->get_page_script();
	}
	
	public function get_page_script(){
	    // #TODO : user language
	    $body_script = '';
	    $lang_iso = 'en_nz';
	    $default_lang_iso = 'en_nz';
	    $adonai_reigns_autoupdate_init_content = get_option('the_gospel_content');
	    if(is_object($adonai_reigns_autoupdate_init_content) && isset($adonai_reigns_autoupdate_init_content->body_script)){
		if(array_key_exists($lang_iso, $adonai_reigns_autoupdate_init_content->body_script)){
		    $body_script = $adonai_reigns_autoupdate_init_content->body_script[$lang_iso];
		}else{
		    $body_script = $adonai_reigns_autoupdate_init_content->body_script[$default_lang_iso];
		}
		$body_script = $this->replace_content_variables($body_script);
		
	    }
	    return $body_script;
	}
	
	public function get_page_content(){
	    // #TODO : user language
	    $body_content = '';
	    $lang_iso = 'en_nz';
	    $default_lang_iso = 'en_nz';
	    $adonai_reigns_autoupdate_init_content = get_option('the_gospel_content');
	    if(is_object($adonai_reigns_autoupdate_init_content) && isset($adonai_reigns_autoupdate_init_content->body_content)){
		if(array_key_exists($lang_iso, $adonai_reigns_autoupdate_init_content->body_content)){
		    $body_content = $adonai_reigns_autoupdate_init_content->body_content[$lang_iso];
		}else{
		    $body_content = $adonai_reigns_autoupdate_init_content->body_content[$default_lang_iso];
		}
		$body_content = $this->replace_content_variables($body_content);
	    }else{
		var_dump($adonai_reigns_autoupdate_init_content);
	    }
	    return $body_content;
	}

	public static function enqueue(){
	    wp_enqueue_script('jquery');
//	    wp_enqueue_script('jquery-ui-core');
	    wp_enqueue_script('jquery-ui-draggable');
	    
	    wp_enqueue_style('sz-booklet', plugins_url('assets/css/sz-booklet.css', __FILE__));
	    wp_enqueue_script('sz-booklet', plugins_url('assets/js/sz-booklet.js', __FILE__));
	    wp_enqueue_script('the-gospel', plugins_url('assets/js/the-gospel.js', __FILE__));
	}

	public static function activate(){
	    require_once(plugin_dir_path(__FILE__).'scripts/plugin-activate.php');
	    Adonai_Reigns_Life_Activate::activate();
	}

	public static function deactivate(){
	    require_once(plugin_dir_path(__FILE__).'scripts/plugin-deactivate.php');
	    Adonai_Reigns_Life_Deactivate::deactivate();
	}


    }

    $adonai_reigns_life_plugin = new Adonai_Reigns_Life();
//    $adonai_reigns_life_plugin->add_shortcodes();
    
    $adonai_reigns_life_plugin->register();
    


    register_activation_hook(__FILE__, array('Adonai_Reigns_Life', 'activate'));

    register_deactivation_hook(__FILE__, array('Adonai_Reigns_Life', 'deactivate'));

    register_deactivation_hook(__FILE__, array('Adonai_Reigns_Life_Uninstall', 'uninstall'));

    
}
