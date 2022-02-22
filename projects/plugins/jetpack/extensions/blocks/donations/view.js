/**
 * External dependencies
 */
import { minimumTransactionAmountForCurrency, parseAmount } from '../../shared/currencies';
import { initializeMembershipButtons } from '../../shared/memberships';

/**
 * WordPress dependencies
 */
import domReady from '@wordpress/dom-ready';
import { ENTER } from '@wordpress/keycodes';
import { addQueryArgs, removeQueryArgs } from '@wordpress/url';
import formatCurrency from '@automattic/format-currency';

/**
 * Internal dependencies
 */
import JetpackDonationsV2 from './deprecated/v2/view';

/**
 * Style dependencies
 */
import '../donations/view.scss';

const ACTIVE_TAB = true;
const INACTIVE_TAB = false;

class JetpackDonations {
	init( block ) {
		this.block = block;
		this.amount = null;
		this.isCustomAmount = false;
		this.interval = 'one-time';
		this.navigationTabs = {
			activeTabClasses: [],
			activeTabStyles: [],
			tabsBorderColorClass: '',
		};

		// Initialize block.
		this.initClasses();
		this.initNavigation();
		this.handleCustomAmount();
		this.handleChosenAmount();

		// Remove loading spinner.
		this.block.querySelector( '.donations__container' ).classList.add( 'loaded' );
	}

	getNavItem( interval ) {
		return this.block.querySelector( `.donations__nav-item[data-interval="${ interval }"]` );
	}

	resetSelectedAmount() {
		const selectedAmount = this.block.querySelector( '.donations__amount.is-selected' );
		if ( selectedAmount ) {
			selectedAmount.classList.remove( 'is-selected' );
		}
	}

	getDonateButton() {
		const buttonIntervalClasses = {
			'one-time': 'donations__one-time-item',
			'1 month': 'donations__monthly-item',
			'1 year': 'donations__annual-item',
		};

		return this.block.querySelector(
			`.${
				buttonIntervalClasses[ this.interval ]
			} .donations__donate-button .wp-block-button__link`
		);
	}

	toggleDonateButton( enable ) {
		const donateButton = this.getDonateButton();
		enable
			? donateButton.parentElement.classList.remove( 'is-disabled' )
			: donateButton.parentElement.classList.add( 'is-disabled' );
	}

	updateUrl() {
		const donateButton = this.getDonateButton();
		const url = donateButton.getAttribute( 'href' );
		if ( this.amount ) {
			donateButton.setAttribute(
				'href',
				addQueryArgs( url, {
					amount: this.amount,
					...( this.isCustomAmount && { customAmount: true } ),
				} )
			);
		} else {
			donateButton.setAttribute( 'href', removeQueryArgs( url, 'amount', 'customAmount' ) );
		}
	}

	updateAmountFromCustomAmountInput( input, wrapper ) {
		const amount = input.innerHTML;
		if ( ! amount ) {
			this.amount = null;
			this.toggleDonateButton( false );
			return;
		}

		// Validates the amount.
		const currency = input.dataset.currency;
		const parsedAmount = parseAmount( amount, currency );
		if ( parsedAmount && parsedAmount >= minimumTransactionAmountForCurrency( currency ) ) {
			wrapper.classList.remove( 'has-error' );
			this.amount = parsedAmount;
			this.toggleDonateButton( true );
		} else {
			wrapper.classList.add( 'has-error' );
			this.amount = null;
			this.toggleDonateButton( false );
		}
		this.updateUrl();
	}

	initNavigation() {
		const navItems = this.block.querySelectorAll( '.donations__nav-item' );
		const tabContent = this.block.querySelector( '.donations__content' );
		const tabContentClasses = {
			'one-time': 'is-one-time',
			'1 month': 'is-monthly',
			'1 year': 'is-annual',
		};

		const handleClick = event => {
			// Update selected interval.
			const prevInterval = this.interval;
			const newInterval = event.target.dataset.interval;
			this.interval = newInterval;

			// Toggle nav item.
			const prevNavItem = this.getNavItem( prevInterval );
			if ( prevNavItem ) {
				prevNavItem.classList.remove( 'is-active' );
				this.setTabActiveState( prevNavItem, INACTIVE_TAB );
			}
			const newNavItem = this.getNavItem( newInterval );
			if ( newNavItem ) {
				newNavItem.classList.add( 'is-active' );
				this.setTabActiveState( newNavItem, ACTIVE_TAB );
			}

			// Toggle tab content.
			tabContent.classList.remove( tabContentClasses[ prevInterval ] );
			tabContent.classList.add( tabContentClasses[ newInterval ] );

			// Reset chosen amount.
			this.amount = null;
			this.isCustomAmount = false;
			this.resetSelectedAmount();
			this.updateUrl();

			// Disable donate button.
			this.toggleDonateButton( false );
		};

		navItems.forEach( navItem => {
			navItem.addEventListener( 'click', handleClick );
			navItem.addEventListener( 'keydown', handleClick );
		} );

		// Activates the default tab on first execution.
		const navItem = this.getNavItem( this.interval );
		if ( navItem ) {
			navItem.classList.add( 'is-active' );
			this.setTabActiveState( navItem, ACTIVE_TAB );
		}
		tabContent.classList.add( tabContentClasses[ this.interval ] );
	}

	handleCustomAmount() {
		this.block.querySelectorAll( '.donations__custom-amount' ).forEach( wrapper => {
			const input = wrapper.querySelector( '.donations__amount-value' );
			// Make input editable.
			input.setAttribute( 'contenteditable', '' );

			// Prevent new lines.
			input.addEventListener( 'keydown', event => {
				if ( event.keyCode === ENTER ) {
					event.preventDefault();
				}
			} );

			input.addEventListener( 'focus', () => {
				// Toggle selected amount.
				this.resetSelectedAmount();
				wrapper.classList.add( 'is-selected' );

				if ( this.isCustomAmount ) {
					return;
				}
				this.isCustomAmount = true;
				this.updateAmountFromCustomAmountInput( input, wrapper );
			} );

			input.addEventListener( 'blur', () => {
				if ( ! this.isCustomAmount || ! this.amount ) {
					return;
				}

				// Formats the entered amount.
				input.innerHTML = formatCurrency( this.amount, input.dataset.currency, {
					symbol: '',
				} );
			} );

			input.addEventListener( 'input', () =>
				this.updateAmountFromCustomAmountInput( input, wrapper )
			);
		} );
	}

	handleChosenAmount() {
		const prefixedAmounts = this.block.querySelectorAll(
			'.donations__amount:not( .donations__custom-amount )'
		);
		prefixedAmounts.forEach( amount => {
			amount.addEventListener( 'click', event => {
				// Toggle amount.
				this.resetSelectedAmount();
				event.target.classList.add( 'is-selected' );
				this.amount = event.target.dataset.amount;
				this.isCustomAmount = false;
				const customAmountWrapper = this.block.querySelector( '.donations__custom-amount' );
				if ( customAmountWrapper ) {
					customAmountWrapper.classList.remove( 'has-error' );
				}
				this.updateUrl();

				// Enables the donate button.
				const donateButton = this.getDonateButton();
				donateButton.parentElement.classList.remove( 'is-disabled' );
			} );
		} );

		// Disable all buttons on init since no amount has been chosen yet.
		this.block
			.querySelectorAll( '.donations__donate-button' )
			.forEach( button => button.classList.add( 'is-disabled' ) );
	}

	initClasses() {
		let color, customColor;

		const matches = this.block.className.match( /.*has-(?<color>.+)-border-color.*/ );
		if ( matches && matches.groups && matches.groups.color ) {
			color = matches.groups.color;
		}

		const hasCustomColor = this.block.className.includes( 'has-border-color' );
		if ( hasCustomColor ) {
			customColor = this.block.style.borderColor;
		}

		const safeColor = color && 'background' !== color ? color : 'foreground';
		const textClass = 'has-background-color';
		const borderClass = `has-${ safeColor }-border-color`;
		const backgroundClass = `has-${ safeColor }-background-color`;

		this.navigationTabs.activeTabClasses.push( 'is-active' );
		this.navigationTabs.activeTabClasses.push( textClass );
		this.navigationTabs.tabsBorderColorClass = borderClass;
		const navItems = this.block.querySelectorAll( '.donations__nav-item' );
		if ( ! color && customColor ) {
			this.navigationTabs.activeTabStyles.borderColor = customColor;
			this.navigationTabs.activeTabStyles.backgroundColor = customColor;
			navItems.forEach( navItem => ( navItem.style.borderColor = customColor ) );
		} else {
			this.navigationTabs.activeTabClasses.push( backgroundClass );
			navItems.forEach( navItem =>
				navItem.classList.add( this.navigationTabs.tabsBorderColorClass )
			);
		}
	}

	setTabActiveState( navItem, isActive ) {
		const eitherAddOrRemove = isActive ? 'add' : 'remove';
		const getPropertyValue = cssProperty =>
			isActive ? this.navigationTabs.activeTabStyles[ cssProperty ] : 'inherit';

		this.navigationTabs.activeTabClasses.forEach( className =>
			navItem.classList[ eitherAddOrRemove ]( className )
		);

		Object.keys( this.navigationTabs.activeTabStyles ).forEach(
			cssProperty => ( navItem.style[ cssProperty ] = getPropertyValue( cssProperty ) )
		);
	}
}

domReady( () => {
	const blocks = document.querySelectorAll( '.wp-block-jetpack-donations' );

	// We can have donation blocks of the current version and previous version on the same page.
	blocks.forEach( donationsBlock => {
		const isDeprecated = donationsBlock.querySelectorAll( '.donations__deprecated' ).length > 0;

		if ( isDeprecated ) {
			const donationsHandler = new JetpackDonationsV2();
			donationsHandler.init( donationsBlock );
			initializeMembershipButtons( '.donations__donate-button' );
		} else {
			const donationsHandler = new JetpackDonations();
			donationsHandler.init( donationsBlock );
			initializeMembershipButtons( '.donations__donate-button .wp-block-button__link' );
		}
	} );
} );
