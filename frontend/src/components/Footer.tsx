const Footer = () => {
  return (
    <footer className="bg-white border-t border-slate-200 mt-auto">
      <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <p className="text-center text-sm text-slate-500">
          &copy; {new Date().getFullYear()} Niti-Setu. Empowering Citizens with Information.
        </p>
      </div>
    </footer>
  );
};

export default Footer;