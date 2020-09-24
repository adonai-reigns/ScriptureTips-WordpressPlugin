<?php

class Adonai_Reigns_Scripturetips
{
    
    protected $old = array(
	'Genesis',
	'Exodus',
	'Leviticus',
	'Numbers',
	'Deuteronomy',
	'Joshua',
	'Judges',
	'Ruth',
	'1 Samuel',
	'2 Samuel',
	'1 Kings',
	'2 Kings',
	'1 Chronicles',
	'2 Chronicles',
	'Ezra',
	'Nehemiah',
	'Esther',
	'Job',
	'Psalms',
	'Proverbs',
	'Ecclesiastes',
	'Songs',
	'Isaiah',
	'Jeremiah',
	'Lamentations',
	'Ezekiel',
	'Daniel',
	'Hosea',
	'Joel',
	'Amos',
	'Obadiah',
	'Jonah',
	'Micah',
	'Nahum',
	'Habakkuk',
	'Zephaniah',
	'Haggai',
	'Zechariah',
	'Malachi'
    );
    
    protected $new = array(
	'1 Jorn',
	'2 Jorn',
	'3 Jorn',
	'Matthew',
	'Mark',
	'Luke',
	'John',
	'Acts',
	'Romans',
	'1 Corinthians',
	'2 Corinthians',
	'Galatians',
	'Ephesians',
	'Philippians',
	'Colossians',
	'1 Thessalonians',
	'2 Thessalonians',
	'1 Timothy',
	'2 Timothy',
	'Titus',
	'Philemon',
	'Hebrews',
	'James',
	'1 Peter',
	'2 Peter',
	'Jude',
	'Revelation'
    );
    
    public $nameTokens = array(
	'1 John' => '1 Jorn',
	'2 John' => '2 Jorn',
	'3 John' => '3 Jorn'
    );

    public function __construct(){
	
    }
    
    protected static $_singletonInstance = null;
    
    // singleton
    public static function getInstance(){
	if(is_null(self::$_singletonInstance)){
	    self::$_singletonInstance = new self;
	}
	return self::$_singletonInstance;
    }
    
    protected function create_book_name_search($bookName) {

	if (is_numeric(substr($bookName, 0, 1))){
	    // it's a multi-book book name
	    $bookNumber = substr($bookName, 0, 1);
	    $bookName = substr($bookName, 2);
	    
	    $bookNameSearch = "/({$bookNumber}\s{$bookName}\s[0-9]{1,3}[a-zA-Z]?[^a-zA-Z\.\,\(\)<\s]*+)/isU";
	    
	
	}else{
	    // it's a book name with no numeric prefix
	    $bookNameSearch = "/({$bookName}\s[0-9]{1,3}[a-zA-Z]?[^a-zA-Z\.\,\(\)<\s]*+)/isU";
	    
	}
	
	return $bookNameSearch;
	
    }
    
    
    /**
     * Convert a scripture reference into an sql query
     * @param string $pattern
     * @param string $version
     * @param string $tablename
     * @param string $columnNames
     * @return string
     */
    public function get_scripture_search_query($pattern, $version='KJV', $tablename='verses', $columnNames='*'){
	
	$bookName = null;
	$internalPattern = str_replace(array_keys($this->nameTokens), array_values($this->nameTokens), $pattern);
	
	foreach (array_merge($this->old, $this->new) as $k=>$v){
	    if(strpos($internalPattern, $v) === 0){
		// found the book!
		$bookName = $v;
		break;
	    }
	}
	
	if(is_null($bookName)){
	    // we didn't find the book that they are seaching for - it might be a non-biblical reference or a shorthand we don't support
	    return null;
	}
	
	// extract the chapter/verse range from the search pattern
	$range = str_replace($bookName, '', $internalPattern);
	
	// strip all whitespace from the chapter/verse range
	$range = preg_replace('/\s/', '', $range);
	
	
	// adapt book name for db selector
	$bookNameSelector = str_replace(array_values($this->nameTokens), array_keys($this->nameTokens), $bookName);
	
	// prepare a uniform sql query
	$bookNameSelector = str_ireplace('Song of Songs', 'Song of Solomon', $bookNameSelector);
	
	if(strpos($range, '-') !== false){
	    // it's a range
	    list($range1, $range2) = explode('-', $range);
	    
	    if(strpos($range1, ':') !== false){
		// it has specified verses
		list($chp, $verse) = explode(':', $range1);
		$chpStart1 = $chpEnd1 = intval($chp);
		$verseStart1 = $verseEnd1 = intval($verse);
	    }else{
		// it is an entire chapter
		$chpStart1 = $chpEnd1 = intval($range1);
		$verseStart1 = 1;
		$verseEnd1 = 200;
	    }
	    
	    if(strpos($range2, ':') !== false){
		// it has specified verses
		list($chp, $verse) = explode(':', $range2);
		$chpStart2 = $chpEnd2 = intval($chp);
		$verseStart2 = $verseEnd2 = intval($verse);
	    }else{
		// it is a verse relative to a preceeding chapter
		$chpStart2 = $chpEnd2 = intval($chpStart1);
		$verseStart2 = $verseEnd2 = $range2;
	    }
	    
	    $sql = "SELECT {$columnNames} FROM `{$tablename}` WHERE `book` = '{$bookNameSelector}' AND `version` = '{$version}' "
	    . "AND (`chapter` >= '{$chpStart1}' AND `verse` >= '{$verseStart1}') "
	    . "AND (`chapter` <= '{$chpEnd2}' AND `verse` <= '{$verseEnd2}') "
	    . "ORDER BY `chapter` ASC, `verse` ASC";
	    
	}else{
	    // it's a single verse
	    
	    if (strpos($range, ':') !== false){
		// it has specified verses
		list($chp, $verse) = explode(':', $range);
		$chpStart = $chpEnd = intval($chp);
		$verseStart = $verseEnd = intval($verse);
	    }else{
		// it is an entire chapter
		$chpStart = $chpEnd = intval($range);
		$verseStart = 1;
		$verseEnd = 200;
	    }
	    
	    $sql = "SELECT {$columnNames} FROM `{$tablename}` WHERE `book` = '{$bookNameSelector}' AND `version` = '{$version}' "
	    . "AND (`chapter` = '{$chpStart}' AND `verse` = '{$verseStart}') "
	    . "ORDER BY `chapter` ASC, `verse` ASC";
	    
	}
	
	return $sql;
	
    }
    
    public function process_scripture_tips($text, $stripHTML=false){
	
	// this prevents naming conflicts
	$str = str_replace(array_keys($this->nameTokens), array_values($this->nameTokens), $text);
	
	// Strip HTML from the string
	if($stripHTML == true){
	    $str = strip_tags($str);
	}
	
	$scriptureTips = array();

	foreach(array_merge($this->old, $this->new) as $bookName){

	    $foundMatches = array();

	    $bookNameSearch = $this->create_book_name_search($bookName);

	    preg_match_all($bookNameSearch, $str, $foundMatches);
	    
	    usort($foundMatches[1], function($a, $b){
		return strlen($b) - strlen($a);
	    });
	    
	    // now we have a list of all the patterns that are found in the text
	    foreach($foundMatches[1] as $k=>$match){
		// prevent links from wrapping any punctuation at the end
		$match = preg_replace('/(.*)[^0-9a-zA-Z]*$/U', '$1', $match);
		
		// we will pass back each matching pattern
		$uniqueKey = md5($match);
		
		$scriptureTips[$uniqueKey] = array(
		    'sorting' => count($scriptureTips),
		    'search' => $bookNameSearch,
		    'search_pattern' => $match,
		    'pattern' => str_replace(array_values($this->nameTokens), array_keys($this->nameTokens), $match),
		    'bookname' => str_replace(array_values($this->nameTokens), array_keys($this->nameTokens), $bookName),
		    'key' => $uniqueKey
		);
		
	    }
	    
	}
	
	usort($scriptureTips, function($a, $b){
	    return $a['sorting'] - $b['sorting'];
	});
	
	return array(
	    'scripturetips' => $scriptureTips,
	    'content' => $str
	);

    }
    
}

