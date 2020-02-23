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

if(!defined( 'ABSPATH' )){
    exit();
}

require_once(__DIR__ . DIRECTORY_SEPARATOR . 'plugin-update.php');
require_once(plugin_dir_path(ADONAI_REIGNS_PLUGIN_FILE) . DIRECTORY_SEPARATOR . 'classes' . DIRECTORY_SEPARATOR . 'Adonai_Reigns' . DIRECTORY_SEPARATOR . 'Gospel' . DIRECTORY_SEPARATOR . 'Booklet.php');

class Adonai_Reigns_Life_Activate
{   
    public static function activate(){
	Adonai_Reigns_Life_Update::force_content_update();
    }
}



