"use client";
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  listCustomers,
  getCustomer,
  createCustomer,
  updateCustomer,
  deleteCustomer,
} from '@/lib/customerApi';

const PAGE_SIZE = 10;

const EMPTY_FORM = {
  name: '',
  email: '',
  phone: '',
  company: '',
  status: 'active',
  address: { street: '', city: '', state: '', postalCode: '', country: '' },
  notes: '',
};

function toForm(customer) {
  return {
    ...EMPTY_FORM,
    ...customer,
    address: { ...EMPTY_FORM.address, ...(customer.address || {}) },
  };
}

function initials(name = '') {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  return (parts[0][0] + (parts.length > 1 ? parts[parts.length - 1][0] : '')).toUpperCase();
}

function hueFor(name = '') {
  let h = 0;
  for (const ch of name) h = (h * 31 + ch.charCodeAt(0)) % 360;
  return h;
}

function formatDate(value) {
  if (!value) return '';
  return new Date(value).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
}

function cityLine(address = {}) {
  return [address.city, address.country].filter(Boolean).join(', ');
}

export default function ClientData() {
  const [customers, setCustomers] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  const [drawer, setDrawer] = useState({ open: false, mode: 'create', id: null });
  const [form, setForm] = useState(EMPTY_FORM);
  const [fieldErrors, setFieldErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);
  const [loadingCustomer, setLoadingCustomer] = useState(false);

  const [confirmId, setConfirmId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [toast, setToast] = useState(null);

  const firstFieldRef = useRef(null);
  const toastTimer = useRef(null);

  const showToast = useCallback((message, tone = 'success') => {
    clearTimeout(toastTimer.current);
    setToast({ message, tone });
    toastTimer.current = setTimeout(() => setToast(null), 3000);
  }, []);

  const loadCustomers = useCallback(async () => {
    setLoading(true);
    setLoadError('');
    try {
      const res = await listCustomers({ search, status, page, limit: PAGE_SIZE });
      setCustomers(res.data);
      setPagination(res.pagination);
    } catch (err) {
      setLoadError(err.message);
    } finally {
      setLoading(false);
    }
  }, [search, status, page]);

  useEffect(() => {
    loadCustomers();
  }, [loadCustomers]);

  useEffect(() => {
    const t = setTimeout(() => {
      const next = searchInput.trim();
      if (next !== search) {
        setSearch(next);
        setPage(1);
      }
    }, 300);
    return () => clearTimeout(t);
  }, [searchInput, search]);

  useEffect(() => () => clearTimeout(toastTimer.current), []);

  const closeDrawer = useCallback(() => {
    if (saving) return;
    setDrawer((d) => ({ ...d, open: false }));
  }, [saving]);

  useEffect(() => {
    if (!drawer.open) return;
    const onKey = (e) => e.key === 'Escape' && closeDrawer();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [drawer.open, closeDrawer]);

  function focusFirstField() {
    setTimeout(() => firstFieldRef.current?.focus(), 60);
  }

  function openCreate() {
    setForm(EMPTY_FORM);
    setFieldErrors({});
    setFormError('');
    setDrawer({ open: true, mode: 'create', id: null });
    focusFirstField();
  }

  async function openEdit(id) {
    setFieldErrors({});
    setFormError('');
    setConfirmId(null);
    setDrawer({ open: true, mode: 'edit', id });
    setLoadingCustomer(true);
    try {
      const res = await getCustomer(id);
      setForm(toForm(res.data));
      focusFirstField();
    } catch (err) {
      setFormError(err.message);
    } finally {
      setLoadingCustomer(false);
    }
  }

  function handleChange(e) {
    const { name, value } = e.target;
    if (name.startsWith('address.')) {
      const key = name.slice('address.'.length);
      setForm((f) => ({ ...f, address: { ...f.address, [key]: value } }));
    } else {
      setForm((f) => ({ ...f, [name]: value }));
    }
    if (fieldErrors[name]) setFieldErrors((errs) => ({ ...errs, [name]: undefined }));
  }

  function validate(values) {
    const errs = {};
    if (values.name.trim().length < 2) errs.name = 'Enter a name with at least 2 characters';
    if (!/^\S+@\S+\.\S+$/.test(values.email.trim())) errs.email = 'Enter a valid email, like name@company.com';
    if (values.phone.trim() && !/^[+()\-\s\d]{7,20}$/.test(values.phone.trim())) {
      errs.phone = 'Use digits, spaces, +, - or brackets (7 to 20 characters)';
    }
    return errs;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const errs = validate(form);
    setFieldErrors(errs);
    setFormError('');
    if (Object.keys(errs).length) return;

    const payload = {
      name: form.name,
      email: form.email,
      phone: form.phone,
      company: form.company,
      status: form.status,
      address: form.address,
      notes: form.notes,
    };

    setSaving(true);
    try {
      if (drawer.mode === 'create') {
        await createCustomer(payload);
        showToast(`Added ${payload.name.trim()}`);
      } else {
        await updateCustomer(drawer.id, payload);
        showToast(`Saved changes to ${payload.name.trim()}`);
      }
      setDrawer((d) => ({ ...d, open: false }));
      if (drawer.mode === 'create' && page !== 1) setPage(1);
      else await loadCustomers();
    } catch (err) {
      setFieldErrors(err.errors || {});
      setFormError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(customer) {
    setDeletingId(customer._id);
    try {
      await deleteCustomer(customer._id);
      setConfirmId(null);
      showToast(`Deleted ${customer.name}`);
      if (customers.length === 1 && page > 1) setPage(page - 1);
      else await loadCustomers();
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setDeletingId(null);
    }
  }

  function clearFilters() {
    setSearchInput('');
    setSearch('');
    setStatus('');
    setPage(1);
  }

  const isFiltered = Boolean(search || status);

  function renderField({ label, name, required = false, hideLabel = false, input }) {
    const error = fieldErrors[name];
    return (
      <div className={`field ${error ? 'has-error' : ''}`}>
        <label htmlFor={name} className={hideLabel ? 'sr-only' : ''}>
          {label}
          {required && <span className="req"> (required)</span>}
        </label>
        {input}
        {error && (
          <p className="field-error" id={`${name}-error`}>
            {error}
          </p>
        )}
      </div>
    );
  }

  function inputProps(name, extra = {}) {
    const value = name.startsWith('address.') ? form.address[name.slice(8)] : form[name];
    return {
      id: name,
      name,
      value: value ?? '',
      onChange: handleChange,
      'aria-invalid': fieldErrors[name] ? true : undefined,
      'aria-describedby': fieldErrors[name] ? `${name}-error` : undefined,
      ...extra,
    };
  }

  return (
    <div className="page">
      <header className="page-head">
        <div>
          <h1>Customers</h1>
          <p className="count">
            {loading && !customers.length
              ? 'Loading…'
              : `${pagination.total} ${pagination.total === 1 ? 'customer' : 'customers'}${
                  isFiltered ? ' match your filters' : ''
                }`}
          </p>
        </div>
        <button className="btn btn-primary" onClick={openCreate}>
          Add customer
        </button>
      </header>

      <div className="toolbar">
        <label className="search">
          <span className="sr-only">Search customers</span>
          <svg viewBox="0 0 20 20" aria-hidden="true">
            <circle cx="9" cy="9" r="6" />
            <path d="M13.5 13.5 18 18" />
          </svg>
          <input
            type="search"
            placeholder="Search by name, email, phone or company"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
          />
        </label>

        <div className="segmented" role="group" aria-label="Filter by status">
          {[
            ['', 'All'],
            ['active', 'Active'],
            ['inactive', 'Inactive'],
          ].map(([value, label]) => (
            <button
              key={label}
              type="button"
              className={status === value ? 'is-selected' : ''}
              aria-pressed={status === value}
              onClick={() => {
                setStatus(value);
                setPage(1);
              }}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <section className="sheet" aria-busy={loading}>
        {loadError ? (
          <div className="state">
            <h2>Customers couldn't load</h2>
            <p>{loadError}</p>
            <button className="btn" onClick={loadCustomers}>
              Try again
            </button>
          </div>
        ) : !loading && customers.length === 0 ? (
          <div className="state">
            {isFiltered ? (
              <>
                <h2>No customers match</h2>
                <p>Try a different search or show all statuses.</p>
                <button className="btn" onClick={clearFilters}>
                  Clear filters
                </button>
              </>
            ) : (
              <>
                <h2>No customers yet</h2>
                <p>Add your first customer to start the list.</p>
                <button className="btn btn-primary" onClick={openCreate}>
                  Add customer
                </button>
              </>
            )}
          </div>
        ) : (
          <table className={`customers ${loading ? 'is-loading' : ''}`}>
            <thead>
              <tr>
                <th scope="col">Customer</th>
                <th scope="col">Phone</th>
                <th scope="col">Company</th>
                <th scope="col">Location</th>
                <th scope="col">Status</th>
                <th scope="col">Added</th>
                <th scope="col">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {customers.map((c) => (
                <tr key={c._id} className={confirmId === c._id ? 'is-confirming' : ''}>
                  <td className="cell-who">
                    <div className="who">
                      <span className="badge" style={{ '--hue': hueFor(c.name) }} aria-hidden="true">
                        {initials(c.name)}
                      </span>
                      <span className="who-text">
                        <span className="who-name">{c.name}</span>
                        <a className="who-email" href={`mailto:${c.email}`}>
                          {c.email}
                        </a>
                      </span>
                    </div>
                  </td>
                  <td data-label="Phone">{c.phone || <span className="none">Not set</span>}</td>
                  <td data-label="Company">{c.company || <span className="none">Not set</span>}</td>
                  <td data-label="Location">{cityLine(c.address) || <span className="none">Not set</span>}</td>
                  <td data-label="Status">
                    <span className={`status status-${c.status}`}>
                      {c.status === 'active' ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td data-label="Added" className="date">
                    {formatDate(c.createdAt)}
                  </td>
                  <td className="actions">
                    {confirmId === c._id ? (
                      <div className="confirm" role="alert" aria-label={`Confirm deleting ${c.name}`}>
                        <span>Delete?</span>
                        <button
                          className="btn btn-danger btn-sm"
                          onClick={() => handleDelete(c)}
                          disabled={deletingId === c._id}
                        >
                          {deletingId === c._id ? 'Deleting…' : 'Yes, delete'}
                        </button>
                        <button className="btn btn-sm" onClick={() => setConfirmId(null)}>
                          Keep
                        </button>
                      </div>
                    ) : (
                      <>
                        <button className="btn btn-ghost btn-sm" onClick={() => openEdit(c._id)}>
                          Edit
                        </button>
                        <button className="btn btn-ghost btn-ghost-danger btn-sm" onClick={() => setConfirmId(c._id)}>
                          Delete
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      {pagination.pages > 1 && !loadError && (
        <nav className="pager" aria-label="Pages">
          <button className="btn btn-sm" disabled={page <= 1 || loading} onClick={() => setPage(page - 1)}>
            Previous
          </button>
          <span>
            Page {pagination.page} of {pagination.pages}
          </span>
          <button
            className="btn btn-sm"
            disabled={page >= pagination.pages || loading}
            onClick={() => setPage(page + 1)}
          >
            Next
          </button>
        </nav>
      )}

      <div className={`scrim ${drawer.open ? 'is-open' : ''}`} onClick={closeDrawer} aria-hidden="true" />
      <aside
        className={`drawer ${drawer.open ? 'is-open' : ''}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="drawer-title"
        inert={drawer.open ? undefined : true}
      >
        <form onSubmit={handleSubmit} noValidate>
          <div className="drawer-head">
            <h2 id="drawer-title">{drawer.mode === 'create' ? 'New customer' : 'Edit customer'}</h2>
            <button type="button" className="icon-btn" onClick={closeDrawer} aria-label="Close">
              <svg viewBox="0 0 20 20" aria-hidden="true">
                <path d="M5 5l10 10M15 5 5 15" />
              </svg>
            </button>
          </div>

          <div className="drawer-body">
            {loadingCustomer ? (
              <p className="muted">Loading customer…</p>
            ) : (
              <>
                {formError && (
                  <p className="form-error" role="alert">
                    {formError}
                  </p>
                )}

                <fieldset>
                  <legend>Contact</legend>
                  {renderField({
                    label: 'Full name',
                    name: 'name',
                    required: true,
                    input: <input ref={firstFieldRef} {...inputProps('name', { autoComplete: 'name' })} />,
                  })}
                  {renderField({
                    label: 'Email',
                    name: 'email',
                    required: true,
                    input: <input {...inputProps('email', { type: 'email', autoComplete: 'email' })} />,
                  })}
                  <div className="row-2">
                    {renderField({
                      label: 'Phone',
                      name: 'phone',
                      input: <input {...inputProps('phone', { type: 'tel', autoComplete: 'tel' })} />,
                    })}
                    {renderField({
                      label: 'Company',
                      name: 'company',
                      input: <input {...inputProps('company', { autoComplete: 'organization' })} />,
                    })}
                  </div>
                  {renderField({
                    label: 'Status',
                    name: 'status',
                    input: (
                      <select {...inputProps('status')}>
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                      </select>
                    ),
                  })}
                </fieldset>

                <fieldset>
                  <legend>Address</legend>
                  {renderField({
                    label: 'Street',
                    name: 'address.street',
                    input: <input {...inputProps('address.street', { autoComplete: 'street-address' })} />,
                  })}
                  <div className="row-2">
                    {renderField({
                      label: 'City',
                      name: 'address.city',
                      input: <input {...inputProps('address.city', { autoComplete: 'address-level2' })} />,
                    })}
                    {renderField({
                      label: 'State or province',
                      name: 'address.state',
                      input: <input {...inputProps('address.state', { autoComplete: 'address-level1' })} />,
                    })}
                  </div>
                  <div className="row-2">
                    {renderField({
                      label: 'Postal code',
                      name: 'address.postalCode',
                      input: <input {...inputProps('address.postalCode', { autoComplete: 'postal-code' })} />,
                    })}
                    {renderField({
                      label: 'Country',
                      name: 'address.country',
                      input: <input {...inputProps('address.country', { autoComplete: 'country-name' })} />,
                    })}
                  </div>
                </fieldset>

                <fieldset>
                  <legend>Notes</legend>
                  {renderField({
                    label: 'Notes',
                    name: 'notes',
                    hideLabel: true,
                    input: (
                      <textarea
                        {...inputProps('notes', {
                          rows: 4,
                          maxLength: 1000,
                          placeholder: 'Anything worth remembering about this customer',
                        })}
                      />
                    ),
                  })}
                </fieldset>
              </>
            )}
          </div>

          <div className="drawer-foot">
            <button type="button" className="btn" onClick={closeDrawer} disabled={saving}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={saving || loadingCustomer}>
              {saving ? 'Saving…' : drawer.mode === 'create' ? 'Add customer' : 'Save changes'}
            </button>
          </div>
        </form>
      </aside>

      <div className="toast-region" aria-live="polite">
        {toast && <div className={`toast toast-${toast.tone}`}>{toast.message}</div>}
      </div>
    </div>
  );
}
