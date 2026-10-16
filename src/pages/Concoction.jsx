import React from 'react'
import EventPage from '../Components/EventPage'
import Footer from './Footer'

const Concoction = () => {
  return (
    <>
      <EventPage
        heading="Concoction"
        category="Department of Youth Capital"
        media="https://res.cloudinary.com/dqb0zmval/video/upload/q_auto,f_auto/dyc/videos/videos_con"
        mediaType="video"
        description="Concoction mixes disciplines and ideas together — a space where creativity from different corners of campus collides into something new."
        galleryRows={[
          [
            '/images/MAGNITUDE.jpg',
            '/images/MAGNITUDE.jpg',
            '/images/MAGNITUDE.jpg',
            '/images/MAGNITUDE.jpg',
            '/images/MAGNITUDE.jpg',
          ],
          [
            '/images/MAGNITUDE.jpg',
            '/images/MAGNITUDE.jpg',
            '/images/MAGNITUDE.jpg',
            '/images/MAGNITUDE.jpg',
            '/images/MAGNITUDE.jpg',
          ],
          [
            '/images/MAGNITUDE.jpg',
            '/images/MAGNITUDE.jpg',
            '/images/MAGNITUDE.jpg',
            '/images/MAGNITUDE.jpg',
            '/images/MAGNITUDE.jpg',
          ],
        ]}
        registrationLink={null}
      />
      <Footer />
    </>
  )
}

export default Concoction