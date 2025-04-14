<?php
/**
 * Cache Helper - Provides caching functionality using APCu
 * Falls back to no caching if APCu is not available
 */

class CacheHelper {
    private $enabled;
    private $ttl;
    private $prefix;

    /**
     * Constructor
     * 
     * @param int $ttl Default time-to-live for cache items in seconds (default: 300 seconds / 5 minutes)
     * @param string $prefix Prefix for cache keys to avoid collisions (default: 'payroll_')
     */
    public function __construct($ttl = 300, $prefix = 'payroll_') {
        $this->enabled = function_exists('apcu_enabled') && apcu_enabled();
        $this->ttl = $ttl;
        $this->prefix = $prefix;
    }

    /**
     * Get an item from cache
     * 
     * @param string $key Cache key
     * @return mixed|null The cached value or null if not found
     */
    public function get($key) {
        if (!$this->enabled) return null;
        
        $fullKey = $this->prefix . $key;
        $success = false;
        $value = apcu_fetch($fullKey, $success);
        
        return $success ? $value : null;
    }

    /**
     * Store an item in cache
     * 
     * @param string $key Cache key
     * @param mixed $value Value to store
     * @param int|null $ttl Optional custom TTL
     * @return bool Success status
     */
    public function set($key, $value, $ttl = null) {
        if (!$this->enabled) return false;
        
        $fullKey = $this->prefix . $key;
        return apcu_store($fullKey, $value, $ttl ?? $this->ttl);
    }

    /**
     * Delete an item from cache
     * 
     * @param string $key Cache key
     * @return bool Success status
     */
    public function delete($key) {
        if (!$this->enabled) return false;
        
        $fullKey = $this->prefix . $key;
        return apcu_delete($fullKey);
    }

    /**
     * Clear all cache entries with this prefix
     * 
     * @return bool Success status
     */
    public function clear() {
        if (!$this->enabled) return false;
        
        $cache = new APCUIterator('/^' . preg_quote($this->prefix) . '/');
        return apcu_delete($cache);
    }

    /**
     * Get cached result or execute callback and cache its result
     * 
     * @param string $key Cache key
     * @param callable $callback Function to execute if cache miss
     * @param int|null $ttl Optional custom TTL
     * @return mixed The cached or callback result
     */
    public function remember($key, $callback, $ttl = null) {
        $value = $this->get($key);
        
        if ($value !== null) {
            return $value;
        }
        
        $value = $callback();
        $this->set($key, $value, $ttl);
        
        return $value;
    }

    /**
     * Check if APCu caching is available and enabled
     * 
     * @return bool
     */
    public function isEnabled() {
        return $this->enabled;
    }
}
?> 