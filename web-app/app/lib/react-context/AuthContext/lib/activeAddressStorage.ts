const ACTIVE_ADDRESS_LOCAL_STORAGE_KEY = 'active-address';

const activeAddressStorage = {
  get: () => localStorage.getItem(ACTIVE_ADDRESS_LOCAL_STORAGE_KEY),
  set: (val: string | null) => {
    if (!val) localStorage.removeItem(ACTIVE_ADDRESS_LOCAL_STORAGE_KEY);
    else localStorage.setItem(ACTIVE_ADDRESS_LOCAL_STORAGE_KEY, val);
  },
};

export default activeAddressStorage;
