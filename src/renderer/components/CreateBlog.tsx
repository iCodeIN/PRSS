import './styles/CreateBlog.scss';

import React, { Fragment, FunctionComponent, useState } from 'react';
import { useHistory } from 'react-router-dom';

import { getString } from '../../common/utils';
import { getSampleSiteStructure } from '../services/blog';
import {
    getHostingTypes,
    setSite,
    setupRemote,
    handleHostingFields
} from '../services/hosting';
import { error, normalize } from '../services/utils';
import Footer from './Footer';
import Header from './Header';
import Loading from './Loading';

const CreateBlog: FunctionComponent = () => {
    const [loading, setLoading] = useState(false);
    const [title, setTitle] = useState('');
    const [loadingStatus, setLoadingStatus] = useState('');
    const [hosting, setHosting] = useState('github');
    const [hostingFields, setHostingFields] = useState({});
    const hostingTypes = getHostingTypes();
    const history = useHistory();

    const handleSubmit = async () => {
        if (!(title && hosting)) {
            error(getString('error_fill_fields'));
            return;
        }

        setLoading(true);
        const siteId = normalize(title);

        /**
         * Handle hosting fields
         * We'll keep any passcode from being saved and will store that safely in the OS keychain
         */
        const parsedHosting = await handleHostingFields({
            name: hosting,
            ...hostingFields
        });

        const baseSite = {
            ...getSampleSiteStructure(),
            id: siteId,
            title,
            hosting: parsedHosting,
            type: 'blog'
        } as ISite;

        /**
         * Set up remote
         */
        const site = await setupRemote(baseSite, setLoadingStatus);
        if (!site) {
            setLoading(false);
            return;
        }

        console.log('site', site);

        /**
         * Save site
         */
        setSite(site);

        /**
         * Go to site preview
         */
        history.push(`/sites/${site.id}`);
    };

    return !loading ? (
        <div className="CreateBlog page">
            <Header />
            <div className="content">
                <h1>{getString('create_blog_title')}</h1>

                <fieldset>
                    <div className="input-group input-group-lg">
                        <input
                            type="text"
                            placeholder="Title"
                            className="form-control"
                            value={title}
                            onChange={e => setTitle(e.target.value)}
                        />
                    </div>
                </fieldset>

                <div className="input-group input-group-lg">
                    <div className="input-group-prepend">
                        <label className="input-group-text">
                            {getString('hosting_label')}
                        </label>
                    </div>
                    <select
                        className="custom-select"
                        onChange={e => setHosting(e.target.value)}
                    >
                        {Object.keys(hostingTypes).map(key => {
                            const { title } = hostingTypes[key];

                            return (
                                <option key={`hosting-${key}`} value={key}>
                                    {title}
                                </option>
                            );
                        })}
                    </select>
                </div>

                {hosting &&
                    hostingTypes[hosting].fields &&
                    hostingTypes[hosting].fields.map(
                        ({ name, title, type }) => (
                            <div
                                className="input-group input-group-lg"
                                key={`${name}-fields`}
                            >
                                <input
                                    type={type}
                                    placeholder={title}
                                    className="form-control"
                                    value={hostingFields[name] || ''}
                                    onChange={e =>
                                        setHostingFields({
                                            ...hostingFields,
                                            ...{ [name]: e.target.value }
                                        })
                                    }
                                />
                            </div>
                        )
                    )}

                <div className="id-info">
                    <span>ID</span>&nbsp;
                    {hosting && hostingTypes[hosting] && title ? (
                        <Fragment>{normalize(title)}</Fragment>
                    ) : (
                        'Enter title'
                    )}
                </div>

                <div className="button-container mt-2">
                    <button
                        onClick={handleSubmit}
                        type="button"
                        className="btn btn-primary btn-lg"
                    >
                        {getString('create_blog_button')}
                    </button>
                </div>
            </div>

            <Footer />
        </div>
    ) : (
        <Loading title={loadingStatus} />
    );
};

export default CreateBlog;
