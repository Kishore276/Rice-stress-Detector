"""
Simplified Rice Disease Detection - Model Training
Uses Keras with simpler imports to avoid path issues
"""

import os
import json
import numpy as np
from keras import layers, models, optimizers, callbacks
from keras.preprocessing.image import ImageDataGenerator
import matplotlib.pyplot as plt
import seaborn as sns
from sklearn.metrics import classification_report, confusion_matrix

# Configuration
IMG_SIZE = 224
BATCH_SIZE = 32
EPOCHS = 50
LEARNING_RATE = 0.001
DATA_DIR = "Rice Leaf Disease Images"
MODEL_DIR = "models"
RESULTS_DIR = "results"

# Create directories
os.makedirs(MODEL_DIR, exist_ok=True)
os.makedirs(RESULTS_DIR, exist_ok=True)

print("\n" + "=" * 50)
print("Rice Disease Detection - Model Training")
print("=" * 50)

print("\n" + "=" * 50)
print("Data Loading and Preprocessing")
print("=" * 50)

# Data Augmentation for Training
train_datagen = ImageDataGenerator(
    rescale=1./255,
    rotation_range=20,
    width_shift_range=0.2,
    height_shift_range=0.2,
    shear_range=0.2,
    zoom_range=0.2,
    horizontal_flip=True,
    vertical_flip=True,
    fill_mode='nearest',
    validation_split=0.2
)

# Training data
train_generator = train_datagen.flow_from_directory(
    DATA_DIR,
    target_size=(IMG_SIZE, IMG_SIZE),
    batch_size=BATCH_SIZE,
    class_mode='categorical',
    subset='training',
    shuffle=True
)

# Validation data
val_generator = train_datagen.flow_from_directory(
    DATA_DIR,
    target_size=(IMG_SIZE, IMG_SIZE),
    batch_size=BATCH_SIZE,
    class_mode='categorical',
    subset='validation',
    shuffle=False
)

# Get class names
class_names = list(train_generator.class_indices.keys())
num_classes = len(class_names)

print(f"✓ Found {train_generator.samples} training images")
print(f"✓ Found {val_generator.samples} validation images")
print(f"✓ Number of classes: {num_classes}")
print(f"✓ Class names: {class_names}")

# Save class indices for inference
class_indices = {v: k for k, v in train_generator.class_indices.items()}
with open(os.path.join(MODEL_DIR, 'class_indices.json'), 'w') as f:
    json.dump(class_indices, f, indent=4)

print("\n" + "=" * 50)
print("Building Custom CNN Model")
print("=" * 50)

# Build model
model = models.Sequential([
    # Input layer
    layers.Input(shape=(224, 224, 3)),
    
    # Block 1
    layers.Conv2D(32, (3, 3), activation='relu', padding='same'),
    layers.BatchNormalization(),
    layers.MaxPooling2D((2, 2)),
    
    # Block 2
    layers.Conv2D(64, (3, 3), activation='relu', padding='same'),
    layers.BatchNormalization(),
    layers.MaxPooling2D((2, 2)),
    layers.Dropout(0.25),
    
    # Block 3
    layers.Conv2D(128, (3, 3), activation='relu', padding='same'),
    layers.BatchNormalization(),
    layers.MaxPooling2D((2, 2)),
    layers.Dropout(0.25),
    
    # Block 4
    layers.Conv2D(256, (3, 3), activation='relu', padding='same'),
    layers.BatchNormalization(),
    layers.MaxPooling2D((2, 2)),
    layers.Dropout(0.3),
    
    # Dense layers
    layers.Flatten(),
    layers.Dense(512, activation='relu'),
    layers.BatchNormalization(),
    layers.Dropout(0.5),
    layers.Dense(256, activation='relu'),
    layers.Dropout(0.5),
    layers.Dense(num_classes, activation='softmax')
])

# Compile model
model.compile(
    optimizer=optimizers.Adam(learning_rate=LEARNING_RATE),
    loss='categorical_crossentropy',
    metrics=['accuracy']
)

# Print model summary
model.summary()

print("\n" + "=" * 50)
print("Setting Up Callbacks")
print("=" * 50)

# Callbacks
checkpoint = callbacks.ModelCheckpoint(
    os.path.join(MODEL_DIR, 'best_model.h5'),
    monitor='val_accuracy',
    save_best_only=True,
    mode='max',
    verbose=1
)

early_stop = callbacks.EarlyStopping(
    monitor='val_loss',
    patience=10,
    restore_best_weights=True,
    verbose=1
)

reduce_lr = callbacks.ReduceLROnPlateau(
    monitor='val_loss',
    factor=0.5,
    patience=5,
    min_lr=1e-7,
    verbose=1
)

callback_list = [checkpoint, early_stop, reduce_lr]

print("\n" + "=" * 50)
print("Training Model")
print("=" * 50)

# Train model
history = model.fit(
    train_generator,
    validation_data=val_generator,
    epochs=EPOCHS,
    callbacks=callback_list,
    verbose=1
)

print("\n" + "=" * 50)
print("Saving Model")
print("=" * 50)

# Save final model
model.save(os.path.join(MODEL_DIR, 'rice_disease_model.h5'))
print("✓ Model saved successfully")

# Save training history
history_dict = {
    'accuracy': [float(x) for x in history.history['accuracy']],
    'val_accuracy': [float(x) for x in history.history['val_accuracy']],
    'loss': [float(x) for x in history.history['loss']],
    'val_loss': [float(x) for x in history.history['val_loss']]
}

with open(os.path.join(RESULTS_DIR, 'training_history.json'), 'w') as f:
    json.dump(history_dict, f, indent=4)

print("\n" + "=" * 50)
print("Evaluating Model")
print("=" * 50)

# Evaluate on validation set
val_loss, val_accuracy = model.evaluate(val_generator)

print(f"\nValidation Metrics:")
print(f"  Accuracy:  {val_accuracy:.4f} ({val_accuracy*100:.2f}%)")
print(f"  Loss:      {val_loss:.4f}")

# Get predictions
val_generator.reset()
y_pred_proba = model.predict(val_generator, verbose=1)
y_pred = np.argmax(y_pred_proba, axis=1)
y_true = val_generator.classes

# Classification report
report = classification_report(y_true, y_pred, target_names=class_names)
print("\nClassification Report:")
print(report)

# Save classification report
with open(os.path.join(RESULTS_DIR, 'classification_report.txt'), 'w') as f:
    f.write("Classification Report\n")
    f.write("=" * 50 + "\n\n")
    f.write(report)

# Confusion matrix
cm = confusion_matrix(y_true, y_pred)
plt.figure(figsize=(10, 8))
sns.heatmap(cm, annot=True, fmt='d', cmap='Blues', xticklabels=class_names, yticklabels=class_names)
plt.title('Confusion Matrix')
plt.ylabel('True Label')
plt.xlabel('Predicted Label')
plt.tight_layout()
plt.savefig(os.path.join(RESULTS_DIR, 'confusion_matrix.png'), dpi=300)
plt.close()
print(f"✓ Confusion matrix saved to {RESULTS_DIR}/confusion_matrix.png")

# Plot training history
plt.figure(figsize=(14, 5))

plt.subplot(1, 2, 1)
plt.plot(history.history['accuracy'], label='Training Accuracy')
plt.plot(history.history['val_accuracy'], label='Validation Accuracy')
plt.title('Model Accuracy')
plt.xlabel('Epoch')
plt.ylabel('Accuracy')
plt.legend()
plt.grid(True)

plt.subplot(1, 2, 2)
plt.plot(history.history['loss'], label='Training Loss')
plt.plot(history.history['val_loss'], label='Validation Loss')
plt.title('Model Loss')
plt.xlabel('Epoch')
plt.ylabel('Loss')
plt.legend()
plt.grid(True)

plt.tight_layout()
plt.savefig(os.path.join(RESULTS_DIR, 'training_curves.png'), dpi=300)
plt.close()
print(f"✓ Training curves saved to {RESULTS_DIR}/training_curves.png")

# Save final metrics
metrics = {
    'val_accuracy': float(val_accuracy),
    'val_loss': float(val_loss),
    'class_names': class_names,
    'num_classes': num_classes,
    'total_params': int(model.count_params()),
    'epochs_trained': len(history.history['accuracy'])
}

with open(os.path.join(RESULTS_DIR, 'final_metrics.json'), 'w') as f:
    json.dump(metrics, f, indent=4)

print("\n" + "=" * 50)
print("Training Complete!")
print("=" * 50)
print(f"\n✓ Model saved to: {MODEL_DIR}/")
print(f"✓ Results saved to: {RESULTS_DIR}/")
print(f"\nFinal Accuracy: {val_accuracy*100:.2f}%")
print("=" * 50)
