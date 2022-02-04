/**
 * External dependencies
 */
import React, { useCallback } from 'react';
import classnames from 'classnames';
import { ActionButton } from '@automattic/jetpack-components';
import { Icon, check, plus } from '@wordpress/icons';
import { getCurrencyObject } from '@automattic/format-currency';
import { __, sprintf } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import styles from './style.module.scss';
import getProductCheckoutUrl from '../../utils/get-product-checkout-url';
import useMyJetpackConnection from '../../hooks/use-my-jetpack-connection';
import { useProduct } from '../../hooks/use-product';
import { BackupIcon, ScanIcon, StarIcon, getIconBySlug, AntiSpamIcon } from '../icons';

/**
 * Simple react component to render the product icon,
 * depending on the product slug.
 *
 * @param {string} slug - The product slug.
 * @returns {object}    ProductDetailCard react component.
 */
function ProductIcon( { slug } ) {
	switch ( slug ) {
		case 'anti-spam':
			return <AntiSpamIcon size={ 24 } />;

		case 'backup':
			return <BackupIcon size={ 24 } />;

		case 'scan':
			return <ScanIcon size={ 24 } />;

		default:
			return null;
	}
}

/**
 * React component to render the price.
 *
 * @param {object} props          - Component props.
 * @param {string} props.value    - Product price
 * @param {string} props.currency - Product current code
 * @param {string} props.isOld    - True when the product price is old
 * @returns {object}                Price react component.
 */
function Price( { value, currency, isOld } ) {
	const priceObject = getCurrencyObject( value, currency );

	const classNames = classnames( styles.price, {
		[ styles[ 'is-old' ] ]: isOld,
	} );

	return (
		<div className={ classNames }>
			<sup className={ styles[ 'price-symbol' ] }>{ priceObject.symbol }</sup>
			<span className={ styles[ 'price-number' ] }>{ priceObject.integer }</span>
			<sup className={ styles[ 'price-fraction' ] }>{ priceObject.fraction }</sup>
		</div>
	);
}

/**
 * Product Detail component.
 *
 * @param {object} props                    - Component props.
 * @param {string} props.slug               - Product slug
 * @param {Function} props.trackButtonClick - Function to call for tracking clicks on Call To Action button
 * @returns {object}                          ProductDetailCard react component.
 */
const ProductDetail = ( { slug, trackButtonClick } ) => {
	const { detail, status, active, isFetching } = useProduct( slug );
	const { title, longDescription, features, pricingForUi, isBundle, supportedProducts } = detail;

	const { isFree, fullPrice, currencyCode, discountedPrice } = pricingForUi;
	const { isUserConnected } = useMyJetpackConnection();

	const addProductUrl = isFree
		? null
		: getProductCheckoutUrl( `jetpack_${ slug }`, isUserConnected ); // @ToDo: Remove this when we have a new product structure.

	// Suppported products icons.
	const icons = isBundle
		? supportedProducts
				.join( '_plus_' )
				.split( '_' )
				.map( ( iconSlug, i ) => {
					if ( iconSlug === 'plus' ) {
						return (
							<Icon
								className={ styles[ 'plus-icon' ] }
								key={ `icon-plugs${ i }` }
								icon={ plus }
								size={ 14 }
							/>
						);
					}

					const SupportedProductIcon = getIconBySlug( iconSlug );
					return <SupportedProductIcon key={ iconSlug } size={ 24 } />;
				} )
		: null;

	const doit = useCallback( () => {
		trackButtonClick();
		if ( [ 'plugin_absent', 'inactive' ].includes( status ) ) {
			activate( slug );
		}
	}, [ activate, status, slug, trackButtonClick ] );
	return (
		<>
			{ isBundle && (
				<div className={ styles[ 'card-header' ] }>
					<StarIcon className={ styles[ 'product-bundle-icon' ] } size={ 16 } />
					{ __( 'Popular upgrade', 'jetpack-my-jetpack' ) }
				</div>
			) }

			<div className={ styles.container }>
				{ isBundle && <div className={ styles[ 'product-icons' ] }>{ icons }</div> }

				<ProductIcon slug={ slug } />

				<h3>{ title }</h3>
				<p className={ styles.name }>{ longDescription }</p>
				<ul className={ styles.features }>
					{ features.map( ( feature, id ) => (
						<li key={ `feature-${ id }` }>
							<Icon icon={ check } size={ 30 } />
							{ feature }
						</li>
					) ) }
				</ul>

				{ ! isFree && (
					<div className={ styles[ 'price-container' ] }>
						<Price value={ fullPrice } currency={ currencyCode } isOld={ true } />
						<Price value={ discountedPrice } currency={ currencyCode } isOld={ false } />
						<div className={ styles[ 'price-description' ] }>
							{ __( '/month, paid yearly', 'jetpack-my-jetpack' ) }
						</div>
					</div>
				) }

				{ isFree && (
					<h3 className={ styles[ 'product-free' ] }>{ __( 'Free', 'jetpack-my-jetpack' ) }</h3>
				) }

				<ActionButton
					onClick={ doit }
					isLoading={ isFetching }
					isLink
					isPrimary={ ! isBundle }
					isSecondary={ isBundle }
					className={ `${ styles[ 'checkout-button' ] } ${
						isBundle ? styles[ 'is-bundle' ] : ''
					}` }
					label={
						/* translators: placeholder is product name. */
						sprintf( __( 'Add %s', 'jetpack-my-jetpack' ), title )
					}
				/>
			</div>
		</>
	);
};

ProductDetail.defaultProps = {
	trackButtonClick: () => {},
};

export { ProductDetail };

/**
 * ProductDetailCard component.
 *
 * @param {object} props          - Component props.
 * @param {string} props.slug     - Product slug
 * @returns {object}                ProductDetailCard react component.
 */
export default function ProductDetailCard( { slug } ) {
	return (
		<div className={ styles.card }>
			<ProductDetail slug={ slug } />
		</div>
	);
}
