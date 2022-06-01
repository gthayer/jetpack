import React from 'react';
import PropTypes from 'prop-types';
import ProductCard from '../connected-product-card';

const ExtrasCard = ( { admin } ) => {
	return <ProductCard admin={ admin } slug="extras" />;
};

ExtrasCard.propTypes = {
	admin: PropTypes.bool.isRequired,
};

export default ExtrasCard;
