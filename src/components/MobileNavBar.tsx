
import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Book, Home, Search, ShoppingCart, PieChart } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const MobileNavBar: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const navigateIfNotCurrent = (path: string) => {
    if (location.pathname !== path) {
      navigate(path);
    }
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 h-16 bg-white border-t border-gray-200 z-10">
      <div className="grid grid-cols-5 h-full text-xs text-temple-dark">
        <button
          onClick={() => navigateIfNotCurrent('/')}
          className={`flex flex-col items-center justify-center ${
            location.pathname === '/' ? 'text-temple-maroon' : ''
          }`}
        >
          <Home className={`h-5 w-5 ${location.pathname === '/' ? 'text-temple-maroon' : ''}`} />
          <span className="mt-1">{t('common.home')}</span>
        </button>
        
        <button
          onClick={() => navigateIfNotCurrent('/books')}
          className={`flex flex-col items-center justify-center ${
            location.pathname === '/books' || location.pathname.startsWith('/books/') ? 'text-temple-maroon' : ''
          }`}
        >
          <Book className={`h-5 w-5 ${location.pathname === '/books' || location.pathname.startsWith('/books/') ? 'text-temple-maroon' : ''}`} />
          <span className="mt-1">{t('common.books')}</span>
        </button>
        
        <button
          onClick={() => navigateIfNotCurrent('/sell-multiple')}
          className={`flex flex-col items-center justify-center ${
            location.pathname === '/sell-multiple' ? 'text-temple-maroon' : ''
          }`}
        >
          <ShoppingCart className={`h-5 w-5 ${location.pathname === '/sell-multiple' ? 'text-temple-maroon' : ''}`} />
          <span className="mt-1">{t('common.sell')}</span>
        </button>
        
        <button
          onClick={() => navigateIfNotCurrent('/search')}
          className={`flex flex-col items-center justify-center ${
            location.pathname === '/search' ? 'text-temple-maroon' : ''
          }`}
        >
          <Search className={`h-5 w-5 ${location.pathname === '/search' ? 'text-temple-maroon' : ''}`} />
          <span className="mt-1">{t('common.search')}</span>
        </button>
        
        <button
          onClick={() => navigateIfNotCurrent('/reports')}
          className={`flex flex-col items-center justify-center ${
            location.pathname === '/reports' ? 'text-temple-maroon' : ''
          }`}
        >
          <PieChart className={`h-5 w-5 ${location.pathname === '/reports' ? 'text-temple-maroon' : ''}`} />
          <span className="mt-1">{t('common.reports')}</span>
        </button>
      </div>
    </div>
  );
};

export default MobileNavBar;
