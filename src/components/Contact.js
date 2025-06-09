import { useState } from 'react';

const Contact = () => {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        subject: '',
        message: ''
    });
    const [isSubmitted, setIsSubmitted] = useState(false);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prevState => ({
            ...prevState,
            [name]: value
        }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        console.log('Form submitted:', formData);
        // Here you would typically send the data to a server
        // For now, we'll just show a success message
        setIsSubmitted(true);
        
        // Reset form after 3 seconds
        setTimeout(() => {
            setIsSubmitted(false);
            setFormData({
                name: '',
                email: '',
                subject: '',
                message: ''
            });
        }, 3000);
    };

    return (
        <div className="contact-container">
            <div className="contact-header">
                <h2>Contact Us</h2>
                <p>Have questions about our properties or services? Reach out to us!</p>
            </div>

            {isSubmitted ? (
                <div className="contact-success">
                    <h3>Thank you for your message!</h3>
                    <p>We'll get back to you as soon as possible.</p>
                </div>
            ) : (
                <form className="contact-form" onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label htmlFor="name">Your Name</label>
                        <input
                            type="text"
                            id="name"
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            required
                            placeholder="Enter your name"
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="email">Email Address</label>
                        <input
                            type="email"
                            id="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            required
                            placeholder="Enter your email"
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="subject">Subject</label>
                        <input
                            type="text"
                            id="subject"
                            name="subject"
                            value={formData.subject}
                            onChange={handleChange}
                            required
                            placeholder="What is this regarding?"
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="message">Message</label>
                        <textarea
                            id="message"
                            name="message"
                            value={formData.message}
                            onChange={handleChange}
                            required
                            placeholder="Your message..."
                            rows="5"
                        ></textarea>
                    </div>

                    <button type="submit" className="contact-submit">Send Message</button>
                </form>
            )}

            <div className="contact-info">
                <div className="info-item">
                    <i className="fas fa-map-marker-alt"></i>
                    <div>
                        <h4>Address</h4>
                        <p>NIET A Block</p>
                    </div>
                </div>

                <div className="info-item">
                    <i className="fas fa-phone-alt"></i>
                    <div>
                        <h4>Phone Number</h4>
                        <p>+91-7752918678</p>
                    </div>
                </div>

                <div className="info-item">
                    <i className="fas fa-envelope"></i>
                    <div>
                        <h4>Email Address</h4>
                        <p>utkarshzz007@gmail.com, gauravpandey@gmail.com, amitkumar@gmail.com</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Contact;
