<?php
/**
 *
 * Plugin Name: Jetpack Promote
 * Plugin URI: https://wordpress.org/plugins/jetpack-promote
 * Description: Promote your products and content using ads.
 * Version: 0.1.0-alpha
 * Author: Automattic
 * Author URI: https://jetpack.com/
 * License: GPLv2 or later
 * Text Domain: jetpack-promote
 *
 * @package automattic/jetpack-promote
 */

/*
This program is free software; you can redistribute it and/or
modify it under the terms of the GNU General Public License
as published by the Free Software Foundation; either version 2
of the License, or (at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License
along with this program; if not, write to the Free Software
Foundation, Inc., 51 Franklin Street, Fifth Floor, Boston, MA  02110-1301, USA.
*/

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

define( 'JETPACK_PROMOTE_DIR', plugin_dir_path( __FILE__ ) );
define( 'JETPACK_PROMOTE_ROOT_FILE', __FILE__ );
define( 'JETPACK_PROMOTE_ROOT_FILE_RELATIVE_PATH', plugin_basename( __FILE__ ) );
define( 'JETPACK_PROMOTE_SLUG', 'jetpack-promote' );
define( 'JETPACK_PROMOTE_NAME', 'Jetpack Promote' );
define( 'JETPACK_PROMOTE_URI', 'https://jetpack.com/jetpack-promote' );
define( 'JETPACK_PROMOTE_FOLDER', dirname( plugin_basename( __FILE__ ) ) );

// Jetpack Autoloader.
$jetpack_autoloader = JETPACK_PROMOTE_DIR . 'vendor/autoload_packages.php';
if ( is_readable( $jetpack_autoloader ) ) {
	require_once $jetpack_autoloader;
	if ( method_exists( \Automattic\Jetpack\Assets::class, 'alias_textdomains_from_file' ) ) {
		\Automattic\Jetpack\Assets::alias_textdomains_from_file( JETPACK_PROMOTE_DIR . 'jetpack_vendor/i18n-map.php' );
	}
} else { // Something very unexpected. Error out gently with an admin_notice and exit loading.
	if ( defined( 'WP_DEBUG' ) && WP_DEBUG ) {
		error_log( // phpcs:ignore WordPress.PHP.DevelopmentFunctions.error_log_error_log
			__( 'Error loading autoloader file for Jetpack Promote plugin', 'jetpack-promote' )
		);
	}

	add_action(
		'admin_notices',
		function () {
			?>
		<div class="notice notice-error is-dismissible">
			<p>
				<?php
				printf(
					wp_kses(
						/* translators: Placeholder is a link to a support document. */
						__( 'Your installation of Jetpack Promote is incomplete. If you installed Jetpack Promote from GitHub, please refer to <a href="%1$s" target="_blank" rel="noopener noreferrer">this document</a> to set up your development environment. Jetpack Promote must have Composer dependencies installed and built via the build command.', 'jetpack-promote' ),
						array(
							'a' => array(
								'href'   => array(),
								'target' => array(),
								'rel'    => array(),
							),
						)
					),
					'https://github.com/Automattic/jetpack/blob/master/docs/development-environment.md#building-your-project'
				);
				?>
			</p>
		</div>
			<?php
		}
	);

	return;
}

// Main plugin class.
new Jetpack_Promote();
