import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import SVGRoundButton from './SVGRoundButton';
import '../../styles/NotFound.css';

const NotFound: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();
    
    const getResourceType = () => {
        if (location.pathname.includes('/map/')) return 'карта';
        if (location.pathname.includes('/animation/')) return 'анимация';
        return 'страница';
    };

    const resourceType = getResourceType();

    return (
        <div className="not-found-page">
            <div className="not-found-background">
                <div className="not-found-graphic">
                    <div className="floating-circle">
                        <div className="circle"></div>
                        <div className="circle-center"></div>
                    </div>
                </div>
                
                <div className="not-found-content">
                    <h1 className="not-found-title">404</h1>
                    <p className="not-found-message">
                        {resourceType === 'страница' 
                            ? 'Страница не найдена'
                            : `${resourceType.charAt(0).toUpperCase() + resourceType.slice(1)} не найдена`
                        }
                    </p>
                    
                    <p className="not-found-description">
                        Возможно, ресурс был удален или вы перешли по неверной ссылке. Это всё, что известно.
                    </p>
                    
                    <div className="not-found-actions">
                        <SVGRoundButton
                            direction="left"
                            onClick={() => navigate("/maps")}
                            size={60}
                            color="white"
							arrowColor="#755DFF"
                            className="svg-round-button"
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default NotFound;