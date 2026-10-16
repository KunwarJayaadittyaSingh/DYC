import React from 'react'
import EventPage from '../Components/EventPage'
import Footer from './Footer'

const Youthvibe = () => {
  return (
    <>
      <EventPage
        heading="Youthvibe"
        category="Department of Youth Capital"
        media="/images/youthvibe-2.jpg"
        mediaType="image"
        description="Youthvibe is the community at the heart of DYC — students coming together to build, perform, and lead across every event under the department."
        galleryRows={[
          [
            '/images/youthvibe-1.jpg',
            '/images/youthvibe-2.jpg',
            '/images/youthvibe-3.jpg',
            '/images/youthvibe-4.jpg',
            '/images/youthvibe-5.jpg',
          ],
          [
            '/images/youthvibe-6.jpg',
            '/images/youthvibe-7.jpg',
            '/images/youthvibe-8.jpg',
            '/images/youthvibe-9.jpg',
            '/images/youthvibe-10.jpg',
          ],
          [
            '/images/youthvibe-11.jpg',
            '/images/youthvibe-12.jpg',
            '/images/youthvibe-13.jpg',
            '/images/youthvibe-14.jpg',
            '/images/youthvibe-15.jpg',
          ],
        ]}
        registrationLink={null}
      />
      <Footer />
    </>
  )
}

export default Youthvibe