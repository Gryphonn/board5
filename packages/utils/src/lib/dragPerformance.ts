/**
 * Performance profiling utilities for drag operations.
 * Uses Performance API for detailed timing analysis in Chrome DevTools.
 * 
 * To view results:
 * 1. Open Chrome DevTools → Performance tab
 * 2. Start recording
 * 3. Perform drag operation
 * 4. Stop recording
 * 5. Look for "Drag:" markers in the timeline
 * 
 * @internal
 */

let isEnabled = false

/**
 * Enable or disable drag performance profiling.
 * Set to true to start tracking, false to disable (default).
 */
export function setDragPerformanceEnabled(enabled: boolean) {
	isEnabled = enabled
	if (typeof window !== 'undefined') {
		(window as any).__tldraw_drag_perf_enabled = enabled
	}
	if (enabled && typeof window !== 'undefined' && 'performance' in window) {
		console.log('%c[Drag Perf] Enabled', 'color: #0f0; font-weight: bold')
		console.log('Open Chrome DevTools → Performance tab to see detailed timeline')
		console.log('Or use window.tldrawDragPerfStats() in console to see summary')
		console.log('Use window.tldrawDragPerfEnable(false) to disable')
	}
}

// Expose global functions for easy console access and for use in other packages
if (typeof window !== 'undefined') {
	;(window as any).tldrawDragPerfEnable = setDragPerformanceEnabled
	;(window as any).tldrawDragPerfStats = logDragPerformanceStats
	;(window as any).tldrawDragPerfClear = clearDragPerformanceMarks
	;(window as any).tldrawDragPerfGetStats = getDragPerformanceStats
	// Also expose the core functions for use in other packages
	;(window as any).__tldraw_dragMark = dragMark
	;(window as any).__tldraw_dragMeasure = dragMeasure
	;(window as any).__tldraw_dragMeasureFn = dragMeasureFn
}

/**
 * Check if drag performance profiling is enabled.
 */
export function isDragPerformanceEnabled(): boolean {
	return isEnabled && typeof window !== 'undefined' && 'performance' in window
}

/**
 * Create a performance mark for drag operations.
 * Marks appear in Chrome DevTools Performance timeline.
 */
export function dragMark(name: string) {
	if (!isDragPerformanceEnabled()) return
	const markName = `Drag:${name}`
	try {
		performance.mark(markName)
        console.log(name, Date.now())
	} catch (e) {
		// Performance API might not be available in some environments
	}
}

/**
 * Measure time between two marks.
 * Creates a measure that appears in Chrome DevTools Performance timeline.
 */
export function dragMeasure(name: string, startMark: string, endMark?: string) {
	if (!isDragPerformanceEnabled()) return
	const measureName = `Drag:${name}`
	try {
		if (endMark) {
			performance.measure(measureName, `Drag:${startMark}`, `Drag:${endMark}`)
		} else {
			performance.measure(measureName, `Drag:${startMark}`)
		}
	} catch (e) {
		// Performance API might not be available
	}
}

/**
 * Measure execution time of a function.
 * Returns the result and logs timing to console.
 */
export function dragMeasureFn<T>(name: string, fn: () => T): T {
	if (!isDragPerformanceEnabled()) {
		return fn()
	}
	
	const startMark = `${name}:start`
	const endMark = `${name}:end`
	
	dragMark(startMark)
	const result = fn()
	dragMark(endMark)
	dragMeasure(name, startMark, endMark)
	
	// Also log to console for quick feedback
	const entries = performance.getEntriesByName(`Drag:${name}`, 'measure')
	if (entries.length > 0) {
		const duration = entries[entries.length - 1].duration
		if (duration > 1) { // Only log if > 1ms to reduce noise
			console.log(`%c[Drag Perf] ${name}: ${duration.toFixed(2)}ms`, 'color: #0af')
		}
	}
	
	return result
}

/**
 * Clear all drag performance marks and measures.
 * Useful for cleaning up between drag sessions.
 */
export function clearDragPerformanceMarks() {
	if (!isDragPerformanceEnabled()) return
	try {
		const marks = performance.getEntriesByType('mark').filter(
			(entry) => entry.name.startsWith('Drag:')
		)
		const measures = performance.getEntriesByType('measure').filter(
			(entry) => entry.name.startsWith('Drag:')
		)
		
		marks.forEach((mark) => performance.clearMarks(mark.name))
		measures.forEach((measure) => performance.clearMeasures(measure.name))
	} catch (e) {
		// Performance API might not be available
	}
}

/**
 * Get summary statistics for drag operations.
 * Useful for analyzing performance over multiple drag operations.
 */
export function getDragPerformanceStats() {
	if (!isDragPerformanceEnabled()) return null
	
	try {
		const measures = performance.getEntriesByType('measure').filter(
			(entry) => entry.name.startsWith('Drag:')
		) as PerformanceMeasure[]
		
		const stats: Record<string, { count: number; total: number; avg: number; max: number; min: number }> = {}
		
		measures.forEach((measure) => {
			const name = measure.name.replace('Drag:', '')
			if (!stats[name]) {
				stats[name] = { count: 0, total: 0, avg: 0, max: 0, min: Infinity }
			}
			
			const stat = stats[name]
			stat.count++
			stat.total += measure.duration
			stat.max = Math.max(stat.max, measure.duration)
			stat.min = Math.min(stat.min, measure.duration)
		})
		
		Object.keys(stats).forEach((name) => {
			const stat = stats[name]
			stat.avg = stat.total / stat.count
		})
		
		return stats
	} catch (e) {
		return null
	}
}

/**
 * Log performance statistics to console.
 */
export function logDragPerformanceStats() {
	const stats = getDragPerformanceStats()
	if (!stats) {
		console.log('%c[Drag Perf] No stats available. Enable profiling first.', 'color: #f80')
		return
	}
	
	console.group('%c[Drag Perf] Statistics', 'color: #0af; font-weight: bold')
	Object.entries(stats)
		.sort((a, b) => b[1].avg - a[1].avg) // Sort by average time descending
		.forEach(([name, stat]) => {
			const color = stat.avg > 16 ? '#f00' : stat.avg > 8 ? '#fa0' : '#0f0'
			console.log(
				`%c${name}: %cavg ${stat.avg.toFixed(2)}ms | max ${stat.max.toFixed(2)}ms | min ${stat.min.toFixed(2)}ms | count ${stat.count}`,
				`color: ${color}; font-weight: bold`,
				'color: inherit'
			)
		})
	console.groupEnd()
}

/**
 * Export performance data as JSON for sharing/analysis.
 * Creates a downloadable file or returns JSON string.
 */
export function exportDragPerformanceData() {
	if (!isDragPerformanceEnabled()) {
		console.log('%c[Drag Perf] No data available. Enable profiling first.', 'color: #f80')
		return null
	}

	try {
		const marks = performance.getEntriesByType('mark')
			.filter((m) => m.name.startsWith('Drag:'))
			.map((m) => ({
				name: m.name,
				startTime: m.startTime,
				duration: m.duration,
			}))

		const measures = performance.getEntriesByType('measure')
			.filter((m) => m.name.startsWith('Drag:'))
			.map((m) => ({
				name: m.name,
				startTime: m.startTime,
				duration: m.duration,
				startMark: (m as any).startMark?.name,
				endMark: (m as any).endMark?.name,
			}))

		const stats = getDragPerformanceStats()

		const exportData = {
			metadata: {
				timestamp: new Date().toISOString(),
				userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown',
				totalMarks: marks.length,
				totalMeasures: measures.length,
			},
			stats,
			marks,
			measures,
		}

		const jsonString = JSON.stringify(exportData, null, 2)

		// Try to download as file
		if (typeof window !== 'undefined' && typeof Blob !== 'undefined' && typeof URL !== 'undefined') {
			try {
				const blob = new Blob([jsonString], { type: 'application/json' })
				const url = URL.createObjectURL(blob)
				const a = document.createElement('a')
				a.href = url
				a.download = `tldraw-drag-perf-${Date.now()}.json`
				document.body.appendChild(a)
				a.click()
				document.body.removeChild(a)
				URL.revokeObjectURL(url)
				console.log('%c[Drag Perf] Data exported and downloaded', 'color: #0f0; font-weight: bold')
				return exportData
			} catch (e) {
				// Fallback to console output if download fails
				console.log('%c[Drag Perf] Export data (copy JSON below):', 'color: #0af; font-weight: bold')
				console.log(jsonString)
				return exportData
			}
		} else {
			// Fallback: just log to console
			console.log('%c[Drag Perf] Export data (copy JSON below):', 'color: #0af; font-weight: bold')
			console.log(jsonString)
			return exportData
		}
	} catch (e) {
		console.error('[Drag Perf] Failed to export data:', e)
		return null
	}
}

// Expose export function globally
if (typeof window !== 'undefined') {
	;(window as any).tldrawDragPerfExport = exportDragPerformanceData
}

